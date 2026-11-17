# homu-zen-theme

Homura's Zen Browser theme, kept as code so any machine (pbox, omen, the next laptop) can get the same look and stay in sync.

## What's here

| Path | What it is |
|---|---|
| `mods.json` | Sine's mod list: every installed mod, its source, version and whether it's on. |
| `mods/<id>/` | A copy of each installed Sine mod, so a profile can be rebuilt even if an upstream repo disappears. |
| `mods-private/<id>/` | Same, for mods whose authors published no license. It is the private submodule homura-ai/homu-zen-theme-private, so this public repo doesn't republish them; without access, `apply` skips them and Sine can install them from their homepage. |
| `tweaks/` | **Homu Zen Theme Tweaks**, this repo's own Sine mod: fixes for clashes between the mods above. Each can be turned off in its settings. |
| `prefs/theme-prefs.js` | Theme and mod settings (Neo Zen, Arc, mod options, toolbar layout, Sine settings). Nothing personal: no history, accounts, workspaces or ids. |
| `profile/chrome/` | LEPTON's `userChrome.css` / `userContent.css` and assets. |
| `profile/user.js` | LEPTON's user.js (theme switches plus privacy defaults). |
| `homu-zen-theme` | The tool (Python 3, no dependencies). |
| `docs/root-brief.md` | Shared brief for agents updating the other Zen repos. |

Homura's own mods are homura-ai/homuzen (Tab State Highlighter, More Essentials, Modify URL Bar Icons, Sine Mod Search and middle-click unload, each opt-in; it includes this repo as a submodule) and homura-ai/Zen-Focus-Space. The four standalone repos homuzen replaced (tab-state-highlighter, more-essentials, modify-url-bar-icons, sine-mod-search) stay installed here until the profile switches to homuzen and is captured again. Neo Zen is installed from the homura-ai/Neo-Zen fork, which carries a settings fix that upstream lacks.

## Use

```bash
cd ~/code/zen/homu-zen-theme
./homu-zen-theme status                 # how the profile differs from the repo
./homu-zen-theme capture                # profile -> repo (then commit)
./homu-zen-theme update                 # check every mod against its upstream source
./homu-zen-theme update --write [ids]   # pull newer upstream copies into mods/ (then commit); mods whose
                                   # layout changed are left for Sine: update them in Zen, then capture
./homu-zen-theme apply --mods-only      # repo mods -> profile; with --wait, waits for Zen to close first
./homu-zen-theme apply                  # everything -> profile, including CSS and prefs; Zen must be closed
./homu-zen-theme apply --wait           # same, but waits for Zen to close first
./homu-zen-theme install-tweaks         # install/refresh Homu Zen Theme Tweaks (safe while Zen runs)
```

`capture` makes the repo match the profile, so apply the repo's updates first (`apply --mods-only`) or capture will revert them; it lists every mod version it changes. `apply` backs up what it replaces to `~/hold/homu-zen-theme-backup-<time>/`. `--profile <dir>` picks another profile; the default is the one Zen starts with.

**New machine:** install Zen, install Sine (github.com/CosmoCreeper/Sine), start Zen once and close it, then clone this repo with `git clone --recurse-submodules` and run `./homu-zen-theme apply`.

**Undo an update:** `git revert <commit>` then `./homu-zen-theme apply --mods-only` (or `apply` with Zen closed).

## Homu Zen Theme Tweaks options

Settings → Sine → Homu Zen Theme Tweaks.

- **Show startup background wipe** (`homu-zen-theme.startup-wipe.enabled`, unticked by default, so the fix is on). At startup Zen fades from a plain background to the workspace gradient. Neo Zen's Color Fixer forces a 2 s transition on that layer, so it plays as a red diagonal gradient with a purple column sweeping in from the left, and the UI appears about 2 s late. Unless this box is ticked, Zen's own instant transition is restored only while Zen is still starting up (`zen-before-loaded`). Workspace switches afterwards keep Neo Zen's smooth transition, and the rest of the Color Fixer keeps working. Checked on 2026-11-16 by recording startups of a copy of the profile in both states.

## License

Homura's own files here are all rights reserved; see [LICENSE](LICENSE) for how to ask for an exception. Each mod under `mods/` and the LEPTON files in `profile/chrome/` belong to their authors and keep their own licenses (MIT, Apache-2.0, GPL-3.0 or MPL-2.0; see the LICENSE file in each folder).
