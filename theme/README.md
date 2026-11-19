# Homu Zen Theme

The `theme/` folder of [homuzen](../README.md): Homura's Zen Browser theme, kept as code so any machine (pbox, omen, the next laptop) can get the same look and stay in sync.

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

To install Homuzen, open Zen **Settings → Sine Mods**, enter `homura-ai/homuzen` in **or, add your own locally from a GitHub repo** and click **Install**. If Sine blocks it, click the gear next to **Install** and tick **Enable installing JS from unofficial sources** first.

A full theme apply installs Homuzen from the repo root. `prefs/theme-prefs.js` turns on Tab State Highlighter, More Essentials, Modify URL Bar Icons, Sine Mod Search and Theme fixes. Middle-click unload stays off until you enable it. The theme uses the `homura-ai/Neo-Zen` fork, which includes a settings fix.

## Use

Run these commands from the `theme/` directory in your clone.

```bash
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

`capture` makes the repo match the profile, so apply the repo's updates first (`apply --mods-only`) or capture will revert them; it lists every mod version it changes. `apply` backs up what it replaces to `~/hold/homu-zen-theme-backup-<time>/`. `--profile <dir>` before the subcommand picks another profile (for example, `./homu-zen-theme --profile /path/to/profile status`); the default is the one Zen starts with.

Homuzen installed by this tool has Sine updates disabled (`no-updates: true`), and `update` skips it. Pull the latest homuzen checkout, then run `./homu-zen-theme install-homuzen` or `apply --mods-only` to refresh its files; start Zen again to load them.

**On a new machine**, install Zen and [Sine](https://github.com/CosmoCreeper/Sine), start Zen once and close it, then clone Homuzen with `git clone https://github.com/homura-ai/homuzen.git`. From the clone, run `git submodule update --init` if you have access to the optional private mods, then run `theme/homu-zen-theme apply`. `apply` skips unavailable mods. You can install them through Sine from their homepages in `mods.json`.

**Undo an update:** `git revert <commit>` then `./homu-zen-theme apply --mods-only` (or `apply` with Zen closed).

## License

Homura's own files here are all rights reserved; see [LICENSE](LICENSE) for how to ask for an exception. Each mod under `mods/` and the LEPTON files in `profile/chrome/` belong to their authors and keep their own licenses (MIT, Apache-2.0, GPL-3.0 or MPL-2.0; see the LICENSE file in each folder).
