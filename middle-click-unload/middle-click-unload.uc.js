// Middle-click unload — loaded by Sine in each browser window.
//
// Zen already treats a middle click on a pinned tab as "unload it, or close
// it if it is already unloaded". This gives regular (unpinned) tabs the same
// behavior: a middle click on a loaded tab unloads it (switching away first if
// it is the selected tab), and a middle click on an unloaded tab closes it.
(() => {
  "use strict";

  if (window.location.href !== "chrome://browser/content/browser.xhtml") return;

  const key = "__homuzenMiddleClickUnload";
  const start = () => {
    window[key]?.destroy();

    const container = window.gBrowser?.tabContainer;
    if (!container) {
      console.warn("[Homuzen] The tab strip is unavailable; middle-click unload is off.");
      return;
    }
    let destroyed = false;

    // The tabs a middle click acts on: the clicked tab, or every tab of its
    // split view, as Zen does for pinned tabs.
    const tabsFor = (tab) => {
      const tabs = tab.group?.hasAttribute("split-view-group") ? tab.group.tabs : [tab];
      return tabs.filter((item) => item && !item.pinned && !item.closing);
    };

    const unload = async (tabs) => {
      const selected = tabs.find((tab) => tab.selected);
      if (selected) window.gBrowser.selectedTab = window.gBrowser._findTabToBlurTo(selected, tabs);
      // Undefined means a beforeunload prompt kept the page: leave it open.
      const done = await window.gBrowser.explicitUnloadTabs(tabs);
      if (!done) return;
      for (const tab of tabs) {
        tab.removeAttribute("discarded");
        // Firefox reports success but keeps some tabs loaded (about:robots,
        // for one). Close those, so the click is never a no-op.
        if (!tab.hasAttribute("pending") && !tab.closing) window.gBrowser.removeTab(tab, { animate: true });
      }
    };

    // Capture phase on the tab strip runs before Firefox's own middle-click
    // close (bubbling phase on the same element). Pinned tabs, multiselected
    // tabs and clicks outside a tab keep their native behavior.
    const onClick = (event) => {
      if (event.button !== 1 || destroyed) return;
      const tab = event.target?.closest?.("tab");
      if (!tab || tab.pinned || tab.multiselected) return;
      const tabs = tabsFor(tab);
      if (!tabs.length) return;
      // Already unloaded: let Firefox close it as usual.
      if (tabs.every((item) => item.hasAttribute("pending"))) return;
      event.stopPropagation();
      event.preventDefault();
      // An open Glance preview in any of these tabs closes first, as Zen does
      // for pinned tabs, and the tabs stay loaded.
      const glanceOwner = tabs.find((item) => item.hasAttribute("glance-id"));
      if (glanceOwner && window.gZenGlanceManager) {
        window.gZenGlanceManager.manageTabClose(glanceOwner.glanceTab);
        return;
      }
      unload(tabs).catch((error) => console.error("[Homuzen] Could not unload the tab:", error));
    };

    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      container.removeEventListener("click", onClick, true);
      window.removeEventListener("unload", destroy);
      if (window[key]?.destroy === destroy) delete window[key];
    };

    window[key] = { destroy };
    window.addEventListener("unload", destroy, { once: true });
    container.addEventListener("click", onClick, true);
  };
  // Homuzen: this part runs only while its opt-in preference is on, and
  // starts or stops live when the preference changes.
  const PREF = "mod.homuzen.middle-click-unload.enabled";
  const gateKey = key + "Gate";
  window[gateKey]?.dispose();
  const apply = () => {
    if (Services.prefs.getBoolPref(PREF, false)) {
      if (!window[key]) start();
    } else {
      window[key]?.destroy();
    }
  };
  const observer = { observe: apply };
  const dispose = () => {
    Services.prefs.removeObserver(PREF, observer);
    window.removeEventListener("unload", dispose);
    window[key]?.destroy();
    if (window[gateKey]?.dispose === dispose) delete window[gateKey];
  };
  window[gateKey] = { dispose };
  Services.prefs.addObserver(PREF, observer);
  window.addEventListener("unload", dispose, { once: true });
  // Sine invokes this hook on disable, removal, and script reload.
  window.addUnloadListener?.(dispose);
  apply();
})();
