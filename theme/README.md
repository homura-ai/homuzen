# Homu Zen Theme

The `theme/` folder of [Homuzen](../README.md) keeps the Zen Browser theme in sync across machines.

## What's here

| Path | What it is |
|---|---|
| `mods.json` | Sine's mod list: every installed mod, its source, version and whether it's on. |
| `mods/<id>/` | A copy of each installed Sine mod, so a profile can be rebuilt even if an upstream repo disappears. |
| `mods-private/<id>/` | Same, for mods whose authors published no license. It is the private submodule homura-ai/homu-zen-theme-private, so the public homuzen repo doesn't republish them; without access, `apply` skips them and Sine can install them from their homepage. |
| `prefs/theme-prefs.js` | Theme and mod settings (Neo Zen, Arc, mod options, toolbar layout, Sine settings). Nothing personal: no history, accounts, workspaces or ids. |
| `profile/chrome/` | LEPTON's `userChrome.css` / `userContent.css` and assets. |
| `profile/user.js` | LEPTON's user.js (theme switches plus privacy defaults). |
| `homu-zen-theme` | The tool (Python 3, no dependencies). |

The tool installs the Homuzen mod from the repo root (everything except `theme/`, `tests/` and the npm files), and `prefs/theme-prefs.js` turns on its parts. Every other mod here is someone else's. Neo Zen is installed from the homura-ai/Neo-Zen fork, which carries a settings fix that upstream lacks.

Homuzen replaced the standalone mods (tab-state-highlighter, more-essentials, modify-url-bar-icons, sine-mod-search) and Homu Zen Theme Tweaks (now its Theme fixes part). Focus Space is no longer part of the theme. A full `apply` removes all of these from a profile, and `capture` never brings them back; `apply --mods-only` and `install-homuzen` leave them installed, because the Homuzen parts that replace them are turned on through prefs, which can only be written while Zen is closed.

## Use

```bash
cd ~/code/zen/homuzen/theme
./homu-zen-theme status                 # how the profile differs from the repo
./homu-zen-theme capture                # profile -> repo (then commit)
./homu-zen-theme update                 # check every mod against its upstream source
./homu-zen-theme update --write [ids]   # pull newer upstream copies into mods/ (then commit); mods whose
                                   # layout changed are left for Sine: update them in Zen, then capture
./homu-zen-theme apply --mods-only      # repo mods -> profile; with --wait, waits for Zen to close first
./homu-zen-theme apply                  # everything -> profile, including CSS and prefs; Zen must be closed
./homu-zen-theme apply --wait           # same, but waits for Zen to close first
./homu-zen-theme install-homuzen        # install/refresh Homuzen from the repo root (safe while Zen runs)
```

`capture` makes the repo match the profile, so apply the repo's updates first (`apply --mods-only`) or capture will revert them; it lists every mod version it changes. `apply` backs up what it replaces to `~/hold/homu-zen-theme-backup-<time>/`. `--profile <dir>` picks another profile; the default is the one Zen starts with.

**New machine:** install Zen, install Sine (github.com/CosmoCreeper/Sine), start Zen once and close it, then clone homuzen with `git clone --recurse-submodules git@github.com:homura-ai/homuzen.git` and run `theme/homu-zen-theme apply`.

**Undo an update:** `git revert <commit>` then `./homu-zen-theme apply --mods-only` (or `apply` with Zen closed).

## License

The theme's original files are all rights reserved. See [LICENSE](LICENSE) for how to ask for an exception. Each mod under `mods/` and the LEPTON files in `profile/chrome/` belong to their authors and keep their own licenses (MIT, Apache-2.0, GPL-3.0 or MPL-2.0; see the LICENSE file in each folder).
