// Modify URL Bar Icons — loaded by Sine in each browser window.
//
// Registers every URL bar icon as a CustomizableUI widget so it shows up in
// "Customize Toolbar…" and can be dragged into any toolbar. A placed widget
// is an empty <toolbaritem> slot: the real icon element is moved into it and
// a hidden placeholder is left in the URL bar so the icon can go back to the
// exact same spot. Nothing is cloned, so the icons keep their own handlers,
// state and popups wherever they live.
(() => {
  "use strict";

  if (window.location.href !== "chrome://browser/content/browser.xhtml") return;

  const key = "__modifyUrlBarIcons";
  window[key]?.destroy();

  const PREFIX = "mubi-"; // widget and slot ids are "mubi-" + element id
  const RELOCATED = "mubi-relocated"; // marks an icon that lives in a slot
  const ZEN_ICONS = "chrome://browser/skin/zen-icons/";
  const EXTENSION_ICON = "chrome://mozapps/skin/extensions/extension.svg";

  // URL bar elements that can be dragged out. `icon` is only the stand-in
  // shown in Customize mode; the real element keeps its own look. Entries
  // with `os` or `pref` exist only where that feature exists.
  const CATALOG = [
    { id: "star-button-box", label: "Bookmark star", icon: ZEN_ICONS + "bookmark-hollow.svg" },
    { id: "reader-mode-button", label: "Reader view", icon: ZEN_ICONS + "reader-mode.svg" },
    { id: "picture-in-picture-button", label: "Picture-in-Picture", icon: "chrome://global/skin/media/picture-in-picture-open.svg" },
    { id: "translations-button", label: "Translate", icon: ZEN_ICONS + "translations.svg" },
    { id: "urlbar-zoom-button", label: "Zoom level", icon: ZEN_ICONS + "zoom-out.svg" },
    { id: "userContext-icons", label: "Container indicator", icon: ZEN_ICONS + "container-tab.svg" },
    { id: "zen-copy-url-button", label: "Copy URL", icon: ZEN_ICONS + "link.svg" },
    { id: "identity-box", label: "Site identity", icon: ZEN_ICONS + "security.svg" },
    { id: "zen-site-data-icon-button", label: "Extensions and site data", icon: ZEN_ICONS + "permissions.svg" },
    { id: "tracking-protection-icon-container", label: "Tracking protection", icon: ZEN_ICONS + "tracking-protection.svg" },
    { id: "share-button", label: "Share", icon: ZEN_ICONS + "share.svg", os: ["Darwin", "WINNT"] },
    { id: "split-view-button", label: "Split view", icon: "chrome://browser/skin/split-view-left-16.svg", pref: "browser.tabs.splitView.enabled" },
    { id: "taskbar-tabs-button", label: "Taskbar tab", icon: "chrome://browser/skin/taskbar-tabs-add-tab.svg", os: ["WINNT"], pref: "browser.taskbarTabs.enabled" },
    { id: "trust-icon-container", label: "Trust panel", icon: ZEN_ICONS + "security.svg", pref: "browser.urlbar.trustPanel.featureGate" },
  ];
  const CATALOG_IDS = new Set(CATALOG.map((spec) => spec.id));
  const VALID_WIDGET_ID = /^[a-z0-9-_]+$/i;

  const CustomizableUI = window.CustomizableUI;
  const pageActions = window.BrowserPageActions;
  const urlbar = document.getElementById("urlbar");
  const toolbox = document.getElementById("navigator-toolbox");
  if (!CustomizableUI || !urlbar || !toolbox) {
    console.warn("[Modify URL Bar Icons] The URL bar or CustomizableUI is unavailable.");
    return;
  }

  const specs = new Map(); // element id -> spec known to this window
  const owned = new Set(); // element ids whose widget this window registered
  const relocated = new Map(); // element id -> icon currently living in a slot
  const placeholders = new Map(); // element id -> placeholder left in the URL bar
  let destroyed = false;
  let syncQueued = false;

  const available = (spec) =>
    (!spec.os || spec.os.includes(Services.appinfo.OS)) &&
    (!spec.pref || Services.prefs.getBoolPref(spec.pref, false));

  const hasWidget = (id) =>
    CustomizableUI.getWidget(PREFIX + id)?.provider === CustomizableUI.PROVIDER_API;

  // Built once per window by CustomizableUI. Only `doc` may be used here: the
  // callback outlives the window that registered the widget.
  const buildSlot = (doc, spec) => {
    const slot = doc.createXULElement("toolbaritem");
    slot.id = PREFIX + spec.id;
    slot.className = "mubi-slot chromeclass-toolbar-additional";
    slot.setAttribute("label", spec.label);
    slot.setAttribute("removable", "true");
    slot.setAttribute("overflows", "false");
    // Stand-in shown while customizing, where the real icon may be hidden.
    const ghost = doc.createXULElement("image");
    ghost.className = "mubi-ghost";
    ghost.setAttribute("src", spec.icon || EXTENSION_ICON);
    slot.appendChild(ghost);
    return slot;
  };

  const ensureWidget = (spec) => {
    if (destroyed || hasWidget(spec.id)) return;
    CustomizableUI.createWidget({
      id: PREFIX + spec.id,
      type: "custom",
      label: spec.label,
      localized: false,
      removable: true,
      overflows: false,
      onBuild: (doc) => buildSlot(doc, spec),
    });
    owned.add(spec.id);
  };

  // Extension page actions are created at runtime with ids the placements
  // can persist, so they get widgets too.
  const discoverPageActions = () => {
    const container = document.getElementById("page-action-buttons");
    for (const node of container?.children ?? []) {
      if (
        !node.id ||
        node.id === "pageActionButton" ||
        specs.has(node.id) ||
        CATALOG_IDS.has(node.id) ||
        !node.classList.contains("urlbar-page-action") ||
        !VALID_WIDGET_ID.test(node.id)
      ) {
        continue;
      }
      const label =
        node.getAttribute("tooltiptext") ||
        node.getAttribute("aria-label") ||
        node.getAttribute("label") ||
        node.id;
      const spec = { id: node.id, label, icon: null };
      specs.set(node.id, spec);
      ensureWidget(spec);
    }
  };

  const attach = (spec, slot) => {
    const node = document.getElementById(spec.id);
    if (!node || node.parentNode === slot) return;
    let placeholder = placeholders.get(spec.id);
    if (!placeholder) {
      placeholder = document.createXULElement("hbox");
      placeholder.className = "mubi-placeholder";
      placeholder.hidden = true;
      placeholders.set(spec.id, placeholder);
    }
    node.replaceWith(placeholder);
    node.setAttribute(RELOCATED, "true");
    slot.appendChild(node);
    relocated.set(spec.id, node);
    // Extension icons come from an inline CSS variable; mirror it for the ghost.
    const ghost = slot.querySelector(".mubi-ghost");
    const image = node.style?.getPropertyValue("--pageAction-image");
    if (ghost && image) ghost.style.listStyleImage = image;
  };

  const restore = (spec) => {
    const node = relocated.get(spec.id);
    const placeholder = placeholders.get(spec.id);
    relocated.delete(spec.id);
    placeholders.delete(spec.id);
    // Firefox removes extension icons it no longer wants; do not revive those.
    if (node && node.parentNode?.classList.contains("mubi-slot")) {
      node.removeAttribute(RELOCATED);
      if (placeholder?.isConnected) {
        placeholder.replaceWith(node);
      } else {
        // The original spot is gone; fall back to the matching URL bar area.
        const fallback = node.classList.contains("urlbar-page-action")
          ? document.getElementById("page-action-buttons")
          : urlbar.querySelector(".urlbar-input-container");
        fallback?.appendChild(node);
      }
    }
    placeholder?.remove();
  };

  const specForSlot = (slot) => {
    const id = slot.id.slice(PREFIX.length);
    let spec = specs.get(id);
    if (!spec) {
      // Registered by another window; this one has not seen the icon yet.
      spec = { id, label: slot.getAttribute("label") || id, icon: null };
      specs.set(id, spec);
    }
    return spec;
  };

  // Put every icon where its slot says it belongs. Unplaced widgets have no
  // slot in the document (or sit in the Customize palette) and stay put.
  const sync = () => {
    syncQueued = false;
    if (destroyed) return;
    discoverPageActions();
    for (const spec of specs.values()) {
      const slot = document.getElementById(PREFIX + spec.id);
      if (slot && CustomizableUI.getPlacementOfWidget(slot.id)) attach(spec, slot);
      else restore(spec);
    }
  };
  const queueSync = () => {
    if (syncQueued || destroyed) return;
    syncQueued = true;
    Promise.resolve().then(sync);
  };

  const listener = {
    onWidgetAfterDOMChange(node, _next, _container, wasRemoval) {
      if (destroyed || node.ownerDocument !== document || !node.id?.startsWith(PREFIX)) return;
      const spec = specForSlot(node);
      if (wasRemoval) restore(spec);
      else attach(spec, node);
    },
  };

  // BrowserPageActions inserts extension icons before the next action's node,
  // which must still be in the URL bar: answer with the placeholder instead.
  const originalGetNextNode = pageActions?._getNextNode;
  const patchedGetNextNode = function (action, forUrlbar) {
    const node = originalGetNextNode.call(this, action, forUrlbar);
    if (forUrlbar && node?.hasAttribute(RELOCATED)) return placeholders.get(node.id) ?? null;
    return node;
  };
  if (originalGetNextNode) pageActions._getNextNode = patchedGetNextNode;

  // Mirror "the URL bar is being edited" onto the toolbox so chrome.css can
  // hide relocated page actions the way Firefox hides them in the bar.
  const updateEditing = () => {
    toolbox.toggleAttribute(
      "mubi-editing",
      urlbar.getAttribute("pageproxystate") === "invalid" || urlbar.hasAttribute("usertyping")
    );
  };
  const editingObserver = new MutationObserver(updateEditing);
  editingObserver.observe(urlbar, { attributes: true, attributeFilter: ["pageproxystate", "usertyping"] });
  updateEditing();

  // Zen adds some icons after the window has loaded, and page actions come
  // and go with navigation: watch the containers they land in.
  const containerObserver = new MutationObserver(queueSync);
  for (const target of [
    document.getElementById("page-action-buttons"),
    urlbar.querySelector(".urlbar-input-container"),
    document.getElementById("identity-box"),
  ]) {
    if (target) containerObserver.observe(target, { childList: true });
  }

  const ensureWidgets = () => {
    for (const spec of CATALOG) {
      if (!specs.has(spec.id) && available(spec)) specs.set(spec.id, spec);
    }
    discoverPageActions();
    for (const spec of specs.values()) ensureWidget(spec);
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    window.removeEventListener("unload", destroy);
    containerObserver.disconnect();
    editingObserver.disconnect();
    toolbox.removeAttribute("mubi-editing");
    // Destroying a widget removes its slot from every window, which restores
    // the icons there through each window's own listener. Placements persist.
    for (const id of owned) CustomizableUI.destroyWidget(PREFIX + id);
    owned.clear();
    for (const id of [...relocated.keys()]) restore({ id });
    for (const placeholder of placeholders.values()) placeholder.remove();
    placeholders.clear();
    CustomizableUI.removeListener(listener);
    if (pageActions && pageActions._getNextNode === patchedGetNextNode) {
      pageActions._getNextNode = originalGetNextNode;
    }
    if (window[key]?.destroy === destroy) delete window[key];
    // Widgets this window registered die with it; another open window with
    // the mod still loaded takes over so the icons stay where the user put them.
    for (const other of Services.wm.getEnumerator("navigator:browser")) {
      if (other !== window && !other.closed) other[key]?.adopt();
    }
  };

  const adopt = () => {
    if (destroyed) return;
    ensureWidgets();
    sync();
  };

  window[key] = { destroy, adopt };
  window.addEventListener("unload", destroy, { once: true });
  // Sine invokes this hook on disable, removal, and script reload.
  window.addUnloadListener?.(destroy);
  CustomizableUI.addListener(listener);
  adopt();
})();
