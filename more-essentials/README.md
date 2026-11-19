# More Essentials

A Sine JavaScript mod for Zen Browser that makes the Essentials cap configurable.

- **Infinite** (default): no numeric limit.
- **Custom**: any whole number from 0 to 9,007,199,254,740,991. Zero prevents new Essentials.
- Changes apply on the next add/drop or context-menu opening, across browser windows.
- Lowering the cap never removes existing tabs. Invalid input falls back to Zen's original cap.
- Turning the part off, or disabling or removing Homuzen, restores Zen's original behavior without changing `zen.tabs.essentials.max`.

## Turn it on

This is one part of [Homuzen](../README.md). Install Homuzen, then turn on **Enable More Essentials** in **Settings → Sine Mods → Homuzen**. Its settings appear under that checkbox.

## Implementation and compatibility

The mod overrides the browser window's `gZenPinnedTabManager.maxEssentialTabs` getter. It returns JavaScript `Infinity` for unlimited mode, rather than substituting a large finite number. Zen uses this getter for its Essentials admission check and context-menu badge. The native preference and existing tabs are untouched.

Verified on 2026-11-16 against Zen 1.24.2b and Sine 2.3.4.1c, using the installed browser and a temporary copy of its profile:

- [Zen's cap getter](https://github.com/zen-browser/desktop/blob/1.24.2b/src/zen/tabs/ZenPinnedTabManager.mjs#L139) still reads `zen.tabs.essentials.max` (default 12). `canEssentialBeAdded` compares the current count with that getter; `addToEssentials`, drag-and-drop, and the context-menu command use that admission check. The badge also reads the getter.
- [Sine's loader and unload hooks](https://github.com/CosmoCreeper/Sine/blob/v2.3.4.1c/src/core/manager.sys.mjs) register the script's `addUnloadListener` callback and invoke it on disable/removal. Cleanup removes the override so Zen's current native cap is visible again.
- The copied-profile smoke test added 13 Essentials with Infinite, rejected a 14th at a Custom cap of 13, preserved existing Essentials after lowering the cap to zero, checked invalid-input fallback and context-menu enablement, and confirmed shared settings and native-cap restoration in two windows through Sine's disable path.

Because this uses an internal Zen API, future browser changes may require another compatibility check.

## Verify

Run `node --test --test-concurrency=1 tests/more-essentials.test.cjs`.

In Zen, check adding a 13th Essential with Infinite, reaching a Custom cap, lowering it below the existing count, drag-and-drop, a second window, and disabling the mod. Existing Essentials should remain after every change.
