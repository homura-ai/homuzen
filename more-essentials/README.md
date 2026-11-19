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

The [Sine unload hook](https://github.com/CosmoCreeper/Sine/blob/v2.3.4.1c/src/core/manager.sys.mjs) removes the override when Homuzen is disabled or removed. More Essentials updates with Homuzen. Changes to Zen's internal API may require an update.

## Verify

Run `node --test --test-concurrency=1 tests/more-essentials.test.cjs`.

In Zen, check adding a 13th Essential with Infinite, reaching a Custom cap, lowering it below the existing count, drag-and-drop, a second window, and disabling the mod. Existing Essentials should remain after every change.
