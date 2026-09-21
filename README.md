# Modify URL Bar Icons

A Sine mod for Zen Browser that lets you move the icons inside the URL bar to any toolbar, using the browser's own **Customize Toolbar** drag and drop.

Every icon becomes an entry in the customize palette. Drag one into the sidebar's top buttons, the bottom buttons, the navigation bar, the tab strip or the bookmarks toolbar, and it moves out of the URL bar; drag it back to the palette and it returns to its original spot. The icons are the real browser elements, not copies, so their state, tooltips, popups and shortcuts keep working wherever they are.

## Icons you can move

| Palette entry | URL bar element |
| --- | --- |
| Bookmark star | `#star-button-box` (Zen normally hides it; moving it out shows it) |
| Reader view | `#reader-mode-button` (shown only on pages with an article) |
| Picture-in-Picture | `#picture-in-picture-button` |
| Translate | `#translations-button` |
| Zoom level | `#urlbar-zoom-button` (shown only when zoom is not 100%) |
| Container indicator | `#userContext-icons` |
| Copy URL | Zen's `#zen-copy-url-button` |
| Site identity | `#identity-box`: the lock, granted permissions and permission-prompt anchors |
| Extensions and site data | Zen's `#zen-site-data-icon-button` (can also be moved on its own out of a moved identity block) |
| Tracking protection | `#tracking-protection-icon-container` |
| Share, Split view, Taskbar tab, Trust panel | Only listed where the feature exists (macOS/Windows, or the Firefox pref is on) |
| *Extension name* | Any page action an extension puts in the URL bar |

Placements are stored by Firefox's customization state, so they survive restarts and disabling and re-enabling the mod.

## Settings

- **Keep icons hidden that Zen hides** (off by default): Zen hides the bookmark star, reader view, tracking protection and permission icons in its URL bar. Moved icons are shown again unless this is on.
- **Hide moved page actions while the URL bar is being edited** (off by default): mirrors how Firefox hides page actions while the bar shows typed text instead of the page address.

## Install with Sine

1. Put this project's files in a GitHub repository.
2. In Zen's **Settings → Sine Mods**, enter that repository's URL in the custom GitHub repository installer.
3. Allow JavaScript from unofficial sources in Sine if required (`sine.allow-unsafe-js`).
4. Right-click a toolbar, choose **Customize Toolbar…**, and drag the URL bar icons where you want them.

This folder is the complete mod source; it has no build step or dependencies.

## Implementation and compatibility

`modify-url-bar-icons.uc.js` registers a `CustomizableUI` widget (`type: "custom"`) per icon. The widget node is an empty `toolbaritem` slot. When a slot is placed in an area, the real icon element is moved into it and a hidden placeholder is left where it came from; removing the slot moves the icon back to the placeholder. `BrowserPageActions._getNextNode` is wrapped so Firefox inserts new extension page actions before the placeholder instead of a node that is no longer in the bar. Click handling for these icons is delegated from `#navigator-toolbox`, which is why they keep working in every toolbar.

Widget registrations are global while Sine runs the script per window, so the window that registered them hands them over to another open window when it closes; the last window removes them and Firefox keeps the placements for next time.

`chrome.css` sizes moved icons like toolbar buttons, collapses slots whose icon Firefox has hidden, shows a stand-in icon while customizing, and lifts the Zen rules that hide icons inside the URL bar.

Verified against Zen `dev` (Firefox 156) and [Sine's loader](https://github.com/CosmoCreeper/Sine/tree/main/src). Because this touches browser internals (`CustomizableUI`, `BrowserPageActions`, the URL bar markup), future Zen or Firefox changes may require an update. Automated checks use a browser-API mock; a real Zen/Sine session still needs a smoke test.

## Verify

Run `node --test tests/*.test.cjs`.

In Zen, open Customize Toolbar, drag the bookmark star into the sidebar top buttons, then check: it toggles bookmarks, survives a restart, follows a second window, returns to the URL bar when dragged back to the palette, and disabling the mod puts every icon back.
