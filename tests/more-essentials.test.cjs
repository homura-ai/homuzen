const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'more-essentials', 'more-essentials.uc.js'), 'utf8');

function browser({ delayed = false, own = false } = {}) {
  const prefs = new Map([['mod.homuzen.more-essentials.enabled', true]]);
  const observers = new Set();
  const timers = new Map();
  const events = new Map();
  let nextTimer = 0;
  let unload;
  let nativeCap = 12;
  const prototype = { get maxEssentialTabs() { return nativeCap; } };
  const manager = Object.create(prototype);
  if (own) Object.defineProperty(manager, 'maxEssentialTabs', {
    configurable: true, enumerable: true, get() { return nativeCap; },
  });
  const window = {
    location: { href: 'chrome://browser/content/browser.xhtml' },
    gZenPinnedTabManager: delayed ? undefined : manager,
    setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(name, callback) { events.set(name, callback); },
    removeEventListener(name, callback) { if (events.get(name) === callback) events.delete(name); },
    addUnloadListener(callback) { unload = callback; },
  };
  const context = vm.createContext({ window, console, Services: {
    prefs: {
      getStringPref(name, fallback) { return prefs.get(name) ?? fallback; },
      getBoolPref(name, fallback) { return prefs.get(name) ?? fallback; },
      addObserver(name, observer) { observers.add(observer); },
      removeObserver(name, observer) { observers.delete(observer); },
    },
  } });
  const run = () => vm.runInContext(source, context);
  run();
  return {
    window, manager, prefs, timers, events, run, observers,
    toggle(on) {
      prefs.set('mod.homuzen.more-essentials.enabled', on);
      for (const observer of [...observers]) observer.observe(null, 'nsPref:changed', 'mod.homuzen.more-essentials.enabled');
    },
    disable: () => unload(),
    native: (value) => { nativeCap = value; },
    custom(value) {
      prefs.set('mod.more-essentials.mode', 'custom');
      prefs.set('mod.more-essentials.cap', value);
    },
    tick() {
      const pending = [...timers.values()];
      timers.clear();
      pending.forEach(callback => callback());
    },
  };
}

test('defaults to real Infinity and updates the admission boundary live', () => {
  const b = browser();
  assert.equal(b.manager.maxEssentialTabs, Infinity);
  b.custom('24');
  assert.ok(23 < b.manager.maxEssentialTabs);
  assert.ok(!(24 < b.manager.maxEssentialTabs));
  b.custom('0');
  assert.equal(b.manager.maxEssentialTabs, 0);
  b.custom(' 9007199254740991 ');
  assert.equal(b.manager.maxEssentialTabs, Number.MAX_SAFE_INTEGER);
  b.prefs.set('mod.more-essentials.mode', 'infinite');
  assert.equal(b.manager.maxEssentialTabs, Infinity);
});

test('invalid values defer to the current native cap', () => {
  const b = browser();
  b.native(18);
  for (const input of ['', ' ', '-1', '2.5', '1e3', '0x10', 'NaN', 'Infinity', '9007199254740992']) {
    b.custom(input);
    assert.equal(b.manager.maxEssentialTabs, 18, input);
  }
  b.prefs.set('mod.more-essentials.mode', 'unknown');
  assert.equal(b.manager.maxEssentialTabs, 18);
});

test('disable restores inherited and own getters and cleans up', () => {
  for (const own of [false, true]) {
    const b = browser({ own });
    b.native(20);
    b.disable();
    b.disable();
    assert.equal(b.manager.maxEssentialTabs, 20);
    assert.equal(Object.hasOwn(b.manager, 'maxEssentialTabs'), own);
    assert.equal(b.timers.size, 0);
    assert.equal(b.events.size, 0);
    assert.equal(b.window.__moreEssentials, undefined);
  }
});

test('supports delayed startup, reload, and cancellation before startup', () => {
  const b = browser({ delayed: true });
  assert.equal(b.timers.size, 1);
  b.window.gZenPinnedTabManager = b.manager;
  b.tick();
  assert.equal(b.manager.maxEssentialTabs, Infinity);
  b.run();
  b.disable();
  assert.equal(b.manager.maxEssentialTabs, 12);
  const pending = browser({ delayed: true });
  pending.disable();
  pending.window.gZenPinnedTabManager = pending.manager;
  pending.tick();
  assert.equal(pending.manager.maxEssentialTabs, 12);
});

test('window unload restores the cap; cleanup preserves a later override', () => {
  const b = browser();
  b.events.get('unload')();
  assert.equal(b.manager.maxEssentialTabs, 12);
  const c = browser();
  Object.defineProperty(c.manager, 'maxEssentialTabs', { configurable: true, value: 99 });
  c.disable();
  assert.equal(c.manager.maxEssentialTabs, 99);
});

test('the Homuzen preference turns the cap override on and off live', () => {
  const b = browser();
  b.native(12);
  assert.equal(b.manager.maxEssentialTabs, Infinity);
  b.toggle(false);
  assert.equal(b.manager.maxEssentialTabs, 12, 'off restores Zen\'s cap');
  b.toggle(true);
  assert.equal(b.manager.maxEssentialTabs, Infinity, 'on installs it again');
  b.disable();
  assert.equal(b.manager.maxEssentialTabs, 12);
  assert.equal(b.observers.size, 0, 'Sine unload removes the preference observer');
});

test('More Essentials settings match the runtime defaults and appear only while the part is on', () => {
  const theme = JSON.parse(fs.readFileSync(path.join(root, 'theme.json')));
  assert.ok(theme.scripts['more-essentials/more-essentials.uc.js']);
  const prefs = JSON.parse(fs.readFileSync(path.join(root, theme.preferences)))
    .filter((pref) => pref.property?.startsWith('mod.more-essentials.'));
  assert.equal(prefs.length, 2);
  for (const pref of prefs) {
    assert.deepEqual(pref.conditions[0], { if: { property: 'mod.homuzen.more-essentials.enabled', value: true } });
  }
  const b = browser();
  for (const pref of prefs) b.prefs.set(pref.property, pref.defaultValue);
  assert.equal(b.manager.maxEssentialTabs, Infinity);
  b.prefs.set('mod.more-essentials.mode', 'custom');
  assert.equal(b.manager.maxEssentialTabs, 12);
});

test('off by default: nothing changes until the part is turned on', () => {
  const b = browser();
  b.prefs.delete('mod.homuzen.more-essentials.enabled');
  b.run();
  assert.equal(b.manager.maxEssentialTabs, 12);
});
