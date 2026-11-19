# Sine Mod Search

Adds a search field above **Settings → Sine Mods → Installed Mods** in Zen.
Search mod names, descriptions, settings labels, preference keys such as
`uc.sidebar.position`, and dropdown option labels/values. Search ignores case
and accents; every word must match somewhere in the same mod. Clear the field
or press Escape to restore the full list.

Matching cards retain Sine's normal Configure, enable, update, and remove controls.
Settings are indexed from local installed preference files, including disabled
mods and settings that have not been opened. The mod does not change preferences,
enable other mods, or send search text anywhere. Results filter whole mod cards,
and the matching words are highlighted in each card and inside its Configure
popup, without changing the popup's controls. Sine only builds a disabled mod's
popup after it is enabled, so those settings match but have no popup text to mark.

![Installed mod search with highlighted matches](screenshot.png)

## Turn it on

This is one part of [Homuzen](../README.md). Install Homuzen, then turn on **Enable Sine Mod Search** in **Settings → Sine Mods → Homuzen**. It has no settings of its own.

## Compatibility and checks

Targets Sine's `#sineModsList` / `.sineItem[mod-id]` settings UI and local mod
metadata API, checked against [Sine source](https://github.com/CosmoCreeper/Sine/tree/fb0bd4ca6af888f10648e126947f7d1f82228433/src).
Works in `about:preferences` and `about:settings`, waiting for Sine's asynchronously
created UI. Sine/Cosine versions that change these internal APIs may need an update.
The search reindexes when Sine rebuilds the installed list or the settings window
regains focus. Turning the part off, or disabling or removing Homuzen, removes its UI and filtering.

Run `npm install`, then `node --test --test-concurrency=1 tests/sine-mod-search.test.cjs`. The DOM tests cover name and settings search,
highlighting in cards and settings popups,
disabled mods, preference keys, dropdown options, delayed UI creation, rebuilt
lists, incomplete preference files, Escape, reload, and unloading during indexing.
They simulate browser APIs; they do not establish live Firefox/XUL compatibility.

Live smoke test after installation:

1. Search for a mod name, a settings label, and a raw preference key. Check that
   the words are highlighted in the cards and in the matching mod's Configure popup.
2. Search for a setting in a disabled mod before opening its Configure dialog.
3. Open Configure on an enabled matching mod and verify its controls still work.
4. Search for a nonexistent term, then clear with Escape.
5. Install/remove another mod with the search active and verify the results refresh.
6. Disable this mod and verify all cards reappear and the search field disappears.
7. Repeat in a second settings tab and after a browser restart.
