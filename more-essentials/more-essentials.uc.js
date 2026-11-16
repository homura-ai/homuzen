// More Essentials — loaded by Sine in each browser window.
(() => {
  "use strict";

  if (window.location.href !== "chrome://browser/content/browser.xhtml") return;

  const key = "__moreEssentials";
  const start = () => {
    window[key]?.destroy();

    let manager;
    let original;
    let timer;
    let attempts = 0;
    let destroyed = false;

    // Read settings on demand so all windows reflect changes immediately, even
    // before Sine has opened the settings UI and initialized its defaults.
    const getCap = function () {
      const mode = Services.prefs.getStringPref("mod.more-essentials.mode", "infinite");
      if (mode === "infinite") return Infinity;
      if (mode === "custom") {
        const input = Services.prefs.getStringPref("mod.more-essentials.cap", "12").trim();
        const value = Number(input);
        if (/^\d+$/.test(input) && Number.isSafeInteger(value)) return value;
      }
      // Preserve Zen's current user preference when the custom value is invalid.
      if (original?.get) return original.get.call(this);
      if (original) return original.value;
      return Reflect.get(Object.getPrototypeOf(this), "maxEssentialTabs", this);
    };

    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      window.clearTimeout(timer);
      window.removeEventListener("unload", destroy);
      if (manager && Object.getOwnPropertyDescriptor(manager, "maxEssentialTabs")?.get === getCap) {
        if (original) Object.defineProperty(manager, "maxEssentialTabs", original);
        else delete manager.maxEssentialTabs;
      }
      if (window[key]?.destroy === destroy) delete window[key];
    };

    const install = () => {
      if (destroyed) return;
      const candidate = window.gZenPinnedTabManager;
      if (!candidate || !("maxEssentialTabs" in candidate)) {
        // Zen preloads the manager asynchronously during window startup.
        if (++attempts < 300) timer = window.setTimeout(install, 100);
        else console.warn("[More Essentials] Zen's Essentials manager was not available.");
        return;
      }
      const descriptor = Object.getOwnPropertyDescriptor(candidate, "maxEssentialTabs");
      if (descriptor && !descriptor.configurable) {
        console.warn("[More Essentials] This Zen version does not allow overriding the cap.");
        return;
      }
      original = descriptor;
      manager = candidate;
      Object.defineProperty(manager, "maxEssentialTabs", {
        configurable: true,
        enumerable: original?.enumerable ?? false,
        get: getCap,
      });
    };

    window[key] = { destroy };
    window.addEventListener("unload", destroy, { once: true });
    install();
  };
  // Homuzen: this part runs only while its opt-in preference is on, and
  // starts or stops live when the preference changes.
  const PREF = "mod.homuzen.more-essentials.enabled";
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
