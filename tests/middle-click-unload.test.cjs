const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'middle-click-unload', 'middle-click-unload.uc.js'), 'utf8');
const PREF = 'mod.homuzen.middle-click-unload.enabled';

class Tab {
  constructor(name, { pinned = false, pending = false, selected = false } = {}) {
    this.name = name;
    this.pinned = pinned;
    this.selected = selected;
    this.multiselected = false;
    this.closing = false;
    this.attributes = new Map(pending ? [['pending', '']] : []);
    this.group = null;
  }
  hasAttribute(name) { return this.attributes.has(name); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  closest(selector) { return selector === 'tab' ? this : null; }
}

function browser({ enabled = true, blocked = false } = {}) {
  const prefs = new Map([[PREF, enabled]]);
  const prefObservers = new Set();
  const listeners = new Set();
  const log = [];
  const tabs = {
    loaded: new Tab('loaded'),
    selected: new Tab('selected', { selected: true }),
    other: new Tab('other'),
    unloaded: new Tab('unloaded', { pending: true }),
    pinned: new Tab('pinned', { pinned: true }),
    about: new Tab('about-robots'),
  };
  const gBrowser = {
    tabContainer: {
      addEventListener(type, callback, capture) { listeners.add(`${type}:${capture}`); this.handler = callback; },
      removeEventListener(type, callback, capture) {
        if (this.handler === callback) { listeners.delete(`${type}:${capture}`); this.handler = null; }
      },
    },
    get selectedTab() { return Object.values(tabs).find((tab) => tab.selected); },
    set selectedTab(tab) { for (const item of Object.values(tabs)) item.selected = item === tab; log.push(`select ${tab.name}`); },
    removeTab(tab) { tab.closing = true; log.push(`close ${tab.name}`); },
    _findTabToBlurTo(tab, exclude) { return exclude.includes(tabs.other) ? tabs.loaded : tabs.other; },
    async explicitUnloadTabs(list) {
      if (blocked) return undefined;
      for (const tab of list) {
        if (tab.name.startsWith('about')) continue; // Firefox keeps some pages loaded
        tab.setAttribute('pending', ''); tab.setAttribute('discarded', 'true');
      }
      log.push(`unload ${list.map((tab) => tab.name).join(',')}`);
      return true;
    },
  };
  let unload;
  const events = new Map();
  const window = {
    location: { href: 'chrome://browser/content/browser.xhtml' },
    gBrowser,
    gZenGlanceManager: { manageTabClose(tab) { log.push(`close glance ${tab}`); } },
    addEventListener(name, callback) { events.set(name, callback); },
    removeEventListener(name, callback) { if (events.get(name) === callback) events.delete(name); },
    addUnloadListener(callback) { unload = callback; },
  };
  const context = vm.createContext({ window, console, Services: { prefs: {
    getBoolPref: (name, fallback) => prefs.get(name) ?? fallback,
    addObserver: (name, observer) => prefObservers.add(observer),
    removeObserver: (name, observer) => prefObservers.delete(observer),
  } } });
  const run = () => vm.runInContext(source, context);
  run();
  // A click as the tab strip's capture listener sees it. Returns whether the
  // event was left for Firefox's own middle-click close.
  const click = async (tab, button = 1, shiftKey = false) => {
    let stopped = false;
    const event = { button, shiftKey, target: tab, stopPropagation() { stopped = true; }, preventDefault() {} };
    gBrowser.tabContainer.handler?.(event);
    await new Promise((resolve) => setImmediate(resolve));
    return !stopped;
  };
  return {
    tabs, log, listeners, prefObservers, click, run,
    disable: () => unload(),
    toggle(on) {
      prefs.set(PREF, on);
      for (const observer of [...prefObservers]) observer.observe(null, 'nsPref:changed', PREF);
    },
  };
}

test('middle-clicking a loaded regular tab unloads it instead of closing it', async () => {
  const b = browser();
  assert.equal(await b.click(b.tabs.loaded), false, 'Firefox close is blocked');
  assert.deepEqual(b.log, ['unload loaded']);
  assert.ok(b.tabs.loaded.hasAttribute('pending'));
  assert.ok(!b.tabs.loaded.hasAttribute('discarded'), 'cleared like Zen does for pinned tabs');
});

test('middle-clicking an unloaded regular tab leaves Firefox to close it', async () => {
  const b = browser();
  assert.equal(await b.click(b.tabs.unloaded), true);
  assert.deepEqual(b.log, []);
  // The second middle click on a tab this part just unloaded closes it.
  await b.click(b.tabs.loaded);
  assert.equal(await b.click(b.tabs.loaded), true);
});

test('Shift+middle-click lets Zen close regular tabs and closes pinned tabs without unloading', async () => {
  const b = browser();
  assert.equal(await b.click(b.tabs.loaded, 1, true), true);
  assert.equal(await b.click(b.tabs.pinned, 1, true), false);
  assert.deepEqual(b.log, ['close pinned']);
});

test('a tab Firefox will not unload is closed, but a kept beforeunload page stays open', async () => {
  const b = browser();
  await b.click(b.tabs.about);
  assert.deepEqual(b.log, ['unload about-robots', 'close about-robots']);
  const c = browser({ blocked: true });
  await c.click(c.tabs.loaded);
  assert.deepEqual(c.log, []);
  assert.equal(c.tabs.loaded.closing, false);
});

test('the selected tab is switched away from before it unloads', async () => {
  const b = browser();
  await b.click(b.tabs.selected);
  assert.deepEqual(b.log, ['select other', 'unload selected']);
  assert.equal(b.tabs.other.selected, true);
});

test('pinned tabs, multiselected tabs and other buttons keep native behavior', async () => {
  const b = browser();
  assert.equal(await b.click(b.tabs.pinned), true);
  b.tabs.other.multiselected = true;
  assert.equal(await b.click(b.tabs.other), true);
  assert.equal(await b.click(b.tabs.loaded, 0), true);
  assert.deepEqual(b.log, []);
});

test('a split view unloads together, and an open Glance closes first', async () => {
  const b = browser();
  const group = { hasAttribute: (name) => name === 'split-view-group', tabs: [b.tabs.loaded, b.tabs.other] };
  b.tabs.loaded.group = group;
  b.tabs.other.group = group;
  await b.click(b.tabs.loaded);
  assert.deepEqual(b.log, ['unload loaded,other']);

  const c = browser();
  c.tabs.loaded.setAttribute('glance-id', '1');
  c.tabs.loaded.glanceTab = 'preview';
  assert.equal(await c.click(c.tabs.loaded), false);
  assert.deepEqual(c.log, ['close glance preview']);

  // The Glance can belong to the other half of the split.
  const d = browser();
  const split = { hasAttribute: (name) => name === 'split-view-group', tabs: [d.tabs.loaded, d.tabs.other] };
  d.tabs.loaded.group = split;
  d.tabs.other.group = split;
  d.tabs.other.setAttribute('glance-id', '2');
  d.tabs.other.glanceTab = 'side preview';
  await d.click(d.tabs.loaded);
  assert.deepEqual(d.log, ['close glance side preview']);
});

test('off by default, follows its preference live, and unloads cleanly', async () => {
  const b = browser({ enabled: false });
  assert.equal(b.listeners.size, 0);
  assert.equal(await b.click(b.tabs.loaded), true);
  b.toggle(true);
  assert.deepEqual([...b.listeners], ['click:true']);
  b.toggle(false);
  assert.equal(b.listeners.size, 0);
  b.toggle(true);
  b.run();
  assert.equal(b.listeners.size, 1, 'reloading the script does not double the listener');
  b.disable();
  assert.equal(b.listeners.size, 0);
  assert.equal(b.prefObservers.size, 0);
});

test('the package loads this part in browser windows behind an off-by-default checkbox', () => {
  const theme = JSON.parse(fs.readFileSync(path.join(root, 'theme.json')));
  assert.deepEqual(theme.scripts['middle-click-unload/middle-click-unload.uc.js'].include, ['chrome://browser/content/browser.xhtml']);
  const prefs = JSON.parse(fs.readFileSync(path.join(root, theme.preferences)));
  const pref = prefs.find((item) => item.property === PREF);
  assert.equal(pref.type, 'checkbox');
  assert.equal(pref.defaultValue, false);
});
