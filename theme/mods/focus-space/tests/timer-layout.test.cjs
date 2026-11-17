const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadMod() {
  const observers = [];
  const context = vm.createContext({
    document: { readyState: 'loading', querySelectorAll: () => [] },
    window: { addEventListener() {} },
    ResizeObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.targets = new Set();
        observers.push(this);
      }
      observe(target) { this.targets.add(target); }
      disconnect() { this.targets.clear(); }
    },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../focus-space.uc.mjs'), 'utf8'), context);
  return { context, observers, run: (script) => vm.runInContext(script, context) };
}

test('end timer clears hover actions and follows sidebar resizing while paused', () => {
  const { context, observers, run } = loadMod();
  const style = new Map();
  let rowRight = 318;
  let buttonLeft = 306;
  const indicator = {
    getBoundingClientRect: () => ({ right: rowRight, width: rowRight }),
    style: {
      getPropertyValue: (key) => style.get(key),
      setProperty: (key, value) => style.set(key, value),
    },
  };
  const button = {
    getBoundingClientRect: () => ({ left: buttonLeft, width: rowRight - buttonLeft }),
  };
  Object.assign(context, { indicator, button });
  run(`activeTimerEl = { parentNode: indicator }; activeToggleBtn = button;
    timerPlacement = 'end'; isPaused = true; watchTimerLayout(); positionEndTimer();`);
  assert.equal(style.get('--zen-fs-timer-right'), '12px');
  assert.ok(observers[0].targets.has(button));
  assert.ok(observers[0].targets.has(indicator));

  buttonLeft = 252; // Hover reveals both trailing actions.
  observers[0].callback();
  assert.equal(style.get('--zen-fs-timer-right'), '66px');

  rowRight = 400; // Sidebar resizing must not need a stopwatch tick either.
  observers[0].callback();
  assert.equal(style.get('--zen-fs-timer-right'), '148px');
  assert.equal(run('timerInterval'), null);
});

test('switching rows and unloading release layout observers', () => {
  const { context, observers, run } = loadMod();
  context.indicator = {};
  run('activeTimerEl = { parentNode: indicator }; watchTimerLayout(); watchTimerLayout();');
  assert.equal(observers[0].targets.size, 0);
  assert.equal(observers[1].targets.size, 1);
  run('removeOwnElements();');
  assert.equal(observers[1].targets.size, 0);
  assert.equal(run('timerResizeObserver'), null);
});
