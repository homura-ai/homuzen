Shared context for the Zen project update roots (written by the "Unify Zen Themes and Sync Projects" thread, 2026-11-16).

- Homura's Zen Browser setup on pbox: Zen 1.24.2b tarball at ~/app/zen (latest release, with Sine loaded via config.js), Sine engine 2.3.4.1c. The live profile is `/home/vi/.var/app/app.zen_browser.zen/.zen/w8r1kqqa.Default (release)`; installed mods are in its `chrome/sine-mods/<id>` and listed in `chrome/sine-mods/mods.json`. Zen is running and Homura is using it.
- All Zen repos now live in the homura-ai org (moved from Homura's personal account 01-1 earlier today; GitHub redirects the old URLs) and are cloned under ~/code/zen/. The unified theme repo is ~/code/zen/homu-zen-theme (homura-ai/homu-zen-theme, private); it owns the live profile's mods.json, prefs and chrome CSS.
- Rules for these roots:
  - Read the live profile, but don't edit it, and never close, restart or kill Zen. For a live check, make a reflink copy of the profile under ~/hold (never /tmp: /tmp is a small tmpfs with a per-user quota and the profile is 1.7 GB), e.g. `cp -a --reflink=always "<profile>" ~/hold/zen-check-<repo>`, which costs almost no space on btrfs. Run a second Zen instance on that copy under a virtual display (Xvfb or `--headless`) with `-no-remote -profile <copy>`. Delete the copy when done. If a check needs Homura's eyes, list the exact steps in your final report.
  - No full test suites on pbox: run one test file at a time with one worker (these repos have a single small `tests/*.test.cjs`, so that's fine). Check `free -h` first.
  - homura-ai public repos accept changes to the default branch only through a PR: push a branch, `gh pr create`, then `gh pr merge` it yourself (no approval needed). Force pushes and tag deletion are blocked.
  - Before merging, run the review-loop skill on the change (fresh Sol reviewer).
  - Bump the `version` in theme.json whenever the mod's behavior changes, so Sine offers the update.
  - Anything sent upstream to someone else's repo (an issue or PR) is drafted for Homura to approve, never posted.
  - Finish with a short plain-text report: what changed, PR links, what's left for Homura (if anything).
