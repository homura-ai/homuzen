# More Essentials

A Sine JavaScript mod for Zen Browser that makes the Essentials cap configurable.

- **Infinite** (default): no numeric limit.
- **Custom**: any whole number from 0 to 9,007,199,254,740,991. Zero prevents new Essentials.
- Changes apply on the next add/drop or context-menu opening, across browser windows.
- Lowering the cap never removes existing tabs. Invalid input falls back to Zen's original cap.
- Disabling or removing the mod restores Zen's original behavior without changing `zen.tabs.essentials.max`.

## Install with Sine

1. Put this project's files in a GitHub repository.
2. In Zen's **Settings → Sine Mods**, enter that repository's URL in the custom GitHub repository installer.
3. Allow JavaScript from unofficial sources in Sine if required (`sine.allow-unsafe-js`).
4. Open **More Essentials** settings and choose **Infinite** or **Custom**. For Custom, enter a cap and leave the field to save it.

This folder is the complete mod source; it has no build step or dependencies. Publishing the repository and installing it in a browser are separate steps.

## Implementation and compatibility

The mod overrides the browser window's `gZenPinnedTabManager.maxEssentialTabs` getter. It returns JavaScript `Infinity` for unlimited mode, rather than substituting a large finite number. Zen uses this getter for its Essentials admission check and context-menu badge. The native preference and existing tabs are untouched.

Verified against [Zen's current manager source](https://github.com/zen-browser/desktop/blob/dev/src/zen/tabs/ZenPinnedTabManager.mjs) and [Sine's loader and settings source](https://github.com/CosmoCreeper/Sine/tree/main/src/core). Because this uses an internal Zen API, future browser changes may require an update. Automated checks use a browser-API mock; a real Zen/Sine session still needs a smoke test.

## Verify

Run `node --test tests/*.test.cjs`.

In Zen, check adding a 13th Essential with Infinite, reaching a Custom cap, lowering it below the existing count, drag-and-drop, a second window, and disabling the mod. Existing Essentials should remain after every change.
