# Homuzen

Homura's Zen Browser tweaks as one [Sine](https://github.com/CosmoCreeper/Sine) mod. It has five parts, and **every part is off until you turn it on** in **Settings → Sine Mods → Homuzen**. A part's own settings appear under its checkbox once it is on, and turning a part off undoes it at once, with no restart.

| Part | What it does | Turn on with |
| --- | --- | --- |
| [Tab State Highlighter](tab-state-highlighter/README.md) | Separate loaded and unloaded effects (ring, glow, dot) for Essentials and regular tabs, with optional unloaded-tab fading | `mod.homuzen.tab-state-highlighter.enabled` |
| Middle-click unload | Middle-click a loaded regular tab to unload it; middle-click an unloaded one to close it | `mod.homuzen.middle-click-unload.enabled` |
| [More Essentials](more-essentials/README.md) | Raise Zen's Essentials cap to infinite or a custom number | `mod.homuzen.more-essentials.enabled` |
| [Modify URL Bar Icons](modify-url-bar-icons/README.md) | Move URL bar icons into any toolbar with Customize Toolbar drag and drop | `mod.homuzen.modify-url-bar-icons.enabled` |
| [Sine Mod Search](sine-mod-search/README.md) | A search box above the installed mods in Settings → Sine Mods | `mod.homuzen.sine-mod-search.enabled` |

The parts were separate mods (homura-ai/tab-state-highlighter, more-essentials, modify-url-bar-icons and sine-mod-search); their full git history is kept here. Each part keeps its old preference names (`mod.tab-state-highlighter.*` and so on), so settings made with the standalone mods carry over.

## Install

1. In Zen, open **Settings → Sine Mods** and enter `https://github.com/homura-ai/homuzen` in the custom GitHub repository installer.
2. Allow JavaScript from unofficial sources in Sine if it asks (`sine.allow-unsafe-js`).
3. Open Homuzen's settings and turn on the parts you want.
4. If the standalone mods are installed, remove them so they don't run twice.

Homuzen depends on [homu-zen-theme](https://github.com/homura-ai/homu-zen-theme), Homura's Zen theme kept as code (the other mods, theme settings and the tool that applies them to a profile). It is a git submodule at `homu-zen-theme/`, so clone with `git clone --recurse-submodules`, or run `git submodule update --init` in an existing clone. Sine installs only the mod itself and ignores the submodule, so the mod also works on its own.

## Middle-click unload

Zen already gives pinned tabs this behavior (`zen.pinned-tab-manager.wheel-close-if-pending`). This part does the same for regular tabs:

- **Loaded tab:** the middle click unloads it instead of closing it. If it is the selected tab, Zen switches to the next tab first.
- **Unloaded tab:** the middle click closes it, as Firefox normally does. So two middle clicks close a loaded tab.
- **A tab Firefox won't unload** (some `about:` pages such as about:robots): the middle click closes it, so a click is never a no-op.
- **Split view:** every tab in the split unloads together.
- **Open Glance preview:** the first middle click closes the preview, as Zen does for pinned tabs.
- Pinned tabs, Essentials and multiselected tabs keep Zen's own behavior.

The script listens for middle clicks on the tab strip in the capture phase, so it runs before Firefox's own middle-click close. It unloads with `gBrowser.explicitUnloadTabs`, the same call Zen uses for pinned tabs.

## Layout

| Path | What it is |
| --- | --- |
| `theme.json` | Sine metadata: one mod, `homuzen` |
| `preferences.json` | Every part's settings, each gated on its `mod.homuzen.<part>.enabled` checkbox |
| `chrome.css` | Imports each part's stylesheet |
| `<part>/` | One folder per part: its script or stylesheet and its own README |
| `tests/` | One test file per part plus `homuzen.test.cjs` for the package |
| `homu-zen-theme/` | Submodule: the theme setup Homuzen depends on (private repo) |

Each stylesheet wraps its rules in `@media -moz-pref("mod.homuzen.<part>.enabled")`. Each script starts its part when the preference is on and stops it when it goes off. Sine keeps one unload hook per script file, so the script's gate owns that hook and stops the part when Sine disables, removes or reloads Homuzen.

## Test

Tests run one file at a time:

```sh
npm install   # jsdom, for the Sine Mod Search tests
node --test --test-concurrency=1 tests/homuzen.test.cjs
node --test --test-concurrency=1 tests/middle-click-unload.test.cjs
```

When the behavior changes, bump `version` and set `updatedAt` later than the published one so Sine offers the update.
