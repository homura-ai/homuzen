const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const theme = JSON.parse(read('theme.json'));
const prefs = JSON.parse(read(theme.preferences));
const PARTS = ['tab-state-highlighter', 'middle-click-unload', 'more-essentials', 'modify-url-bar-icons', 'sine-mod-search'];

test('Sine metadata points updates at homura-ai/homuzen and names existing files', () => {
  for (const field of ['id', 'name', 'description', 'homepage', 'version', 'createdAt', 'updatedAt', 'style', 'preferences', 'fork']) {
    assert.ok(theme[field], field);
  }
  assert.equal(theme.id, 'homuzen');
  assert.equal(theme.homepage, 'https://github.com/homura-ai/homuzen');
  assert.equal(theme.readme, 'https://raw.githubusercontent.com/homura-ai/homuzen/main/README.md');
  assert.ok(Date.parse(theme.updatedAt) > Date.parse(theme.createdAt));
  assert.equal(theme.supportsUnload, true);
  for (const file of [theme.style, theme.preferences, ...Object.keys(theme.scripts)]) assert.ok(fs.existsSync(path.join(root, file)), file);
  for (const [, file] of read(theme.style).matchAll(/@import url\("([^"]+)"\)/g)) assert.ok(fs.existsSync(path.join(root, file)), file);
});

test('every part is an opt-in checkbox and its settings show only while it is on', () => {
  const enables = prefs.filter((pref) => pref.property?.startsWith('mod.homuzen.'));
  assert.deepEqual(enables.map((pref) => pref.property), PARTS.map((part) => `mod.homuzen.${part}.enabled`));
  for (const pref of enables) {
    assert.equal(pref.type, 'checkbox');
    assert.equal(pref.defaultValue, false, pref.property);
    assert.equal(pref.conditions, undefined, pref.property);
  }
  const ids = prefs.map((pref) => pref.id ?? pref.property).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, 'unique element ids');
  for (const pref of prefs) {
    if (pref.property?.startsWith('mod.homuzen.') || pref.id?.endsWith('-section') || !(pref.id || pref.property)) continue;
    const gate = pref.conditions?.[0]?.if?.property;
    assert.match(gate ?? '', /^mod\.homuzen\.[a-z-]+\.enabled$/, pref.id ?? pref.property);
    assert.equal(pref.operator, 'AND', pref.id ?? pref.property);
  }
});

test('every stylesheet and script is gated by its part preference', () => {
  for (const part of ['tab-state-highlighter', 'modify-url-bar-icons']) {
    const css = read(`${part}/chrome.css`).replace(/\/\*[\s\S]*?\*\//g, '').trim();
    assert.ok(css.startsWith(`@media -moz-pref("mod.homuzen.${part}.enabled") {`), part);
    assert.ok(css.endsWith('}'), part);
  }
  for (const script of Object.keys(theme.scripts)) {
    const part = script.split('/')[0];
    const code = read(script);
    assert.ok(code.includes(`const PREF = "mod.homuzen.${part}.enabled";`), script);
    // Sine keeps one unload hook per script file; only the gate registers it.
    assert.equal(code.match(/addUnloadListener/g).length, 1, script);
  }
});
