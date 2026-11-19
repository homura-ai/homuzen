# Homuzen

Homura's Zen Browser tweaks as one [Sine](https://github.com/CosmoCreeper/Sine) mod, plus the theme setup they are used with ([`theme/`](theme/README.md)). The mod has six parts, and **every part is off until you turn it on** in **Settings → Sine Mods → Homuzen**. A part's own settings appear under its checkbox once it is on, and turning a part off undoes it at once, with no restart.

| Part | What it does | Turn on with |
| --- | --- | --- |
| [Tab State Highlighter](tab-state-highlighter/README.md) | Separate loaded and unloaded effects (ring, glow, dot) for Essentials and regular tabs, with optional unloaded-tab fading | `mod.homuzen.tab-state-highlighter.enabled` |
| Middle-click unload | Middle-click a loaded regular tab to unload it; middle-click an unloaded one to close it | `mod.homuzen.middle-click-unload.enabled` |
| [More Essentials](more-essentials/README.md) | Raise Zen's Essentials cap to infinite or a custom number | `mod.homuzen.more-essentials.enabled` |
| [Modify URL Bar Icons](modify-url-bar-icons/README.md) | Move URL bar icons into any toolbar with Customize Toolbar drag and drop | `mod.homuzen.modify-url-bar-icons.enabled` |
| [Sine Mod Search](sine-mod-search/README.md) | A search box above the installed mods in Settings → Sine Mods | `mod.homuzen.sine-mod-search.enabled` |
| Theme fixes | Fixes for clashes between the mods in Homura's theme | `mod.homuzen.theme-fixes.enabled` |

## Install

1. In Zen, open **Settings → Sine Mods**, enter `homura-ai/homuzen` in **or, add your own locally from a GitHub repo** and click **Install**. If Sine blocks it, click the gear next to **Install**, tick **Enable installing JS from unofficial sources** and try again.
2. Open Homuzen's settings and turn on the parts you want.

The theme setup is in [`theme/`](theme/README.md): copies of the other authors' mods, theme settings, and the tool that applies them to a Zen profile. It installs Homuzen from this repo and turns its parts on. Its private mods are a submodule, so clone with `git clone --recurse-submodules`, or run `git submodule update --init` in an existing clone. Sine installs only the mod and does not use `theme/`.

## Middle-click unload

Zen already gives pinned tabs this behavior (`zen.pinned-tab-manager.wheel-close-if-pending`). This part does the same for regular tabs:

- **Loaded tab:** the middle click unloads it instead of closing it. If it is the selected tab, Zen switches to the next tab first.
- **Unloaded tab:** the middle click closes it, as Firefox normally does. So two middle clicks close a loaded tab.
- **A tab Firefox won't unload** (some `about:` pages such as about:robots): the middle click closes it, so a click is never a no-op.
- **Split view:** every tab in the split unloads together.
- **Open Glance preview:** the first middle click closes the preview, as Zen does for pinned tabs.
- Pinned tabs, Essentials and multiselected tabs keep Zen's own behavior.

The script listens for middle clicks on the tab strip in the capture phase, so it runs before Firefox's own middle-click close. It unloads with `gBrowser.explicitUnloadTabs`, the same call Zen uses for pinned tabs.

## Theme fixes

- **Startup background wipe.** At startup Zen fades from a plain background to the workspace gradient. Neo Zen's Color Fixer forces a 2 s transition on that layer, so it plays as a red diagonal gradient with a purple column sweeping in from the left, and the UI appears about 2 s late. This part restores Zen's own instant transition only while Zen is still starting up (`zen-before-loaded`). Workspace switches afterwards keep Neo Zen's smooth transition, and the rest of the Color Fixer keeps working. Checked on 2026-11-16 by recording startups of a copy of the profile in both states.

## Layout

| Path | What it is |
| --- | --- |
| `theme.json` | Sine metadata: one mod, `homuzen` |
| `preferences.json` | Every part's settings, each gated on its `mod.homuzen.<part>.enabled` checkbox |
| `chrome.css` | Imports each part's stylesheet |
| `<part>/` | One folder per part: its script or stylesheet and its own README |
| `tests/` | One test file per part plus `homuzen.test.cjs` for the package |
| `theme/` | The theme setup: other authors' mods, theme settings and the `homu-zen-theme` tool ([README](theme/README.md)) |

Each stylesheet wraps its rules in `@media -moz-pref("mod.homuzen.<part>.enabled")`. Each script starts its part when the preference is on and stops it when it goes off. Sine keeps one unload hook per script file, so the script's gate owns that hook and stops the part when Sine disables, removes or reloads Homuzen.

## Test

Tests run one file at a time:

```sh
npm install   # jsdom, for the Sine Mod Search tests
node --test --test-concurrency=1 tests/homuzen.test.cjs
node --test --test-concurrency=1 tests/middle-click-unload.test.cjs
```

When the behavior changes, bump `version` and set `updatedAt` later than the published one so Sine offers the update.
