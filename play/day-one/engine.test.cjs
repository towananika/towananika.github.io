/* 二水の状態遷移。画面に依存せず、遊びの約束だけを確認する。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const store = Object.create(null);
const context = {
  Math: Object.create(Math), JSON,
  localStorage: {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = value; },
    removeItem(key) { delete store[key]; }
  }
};
context.window = context;
context.Math.random = () => 0;
vm.createContext(context);
['content.js', 'engine.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(__dirname + '/' + file, 'utf8'), context, { filename: file });
});

let state = context.TriDayOne.start();
assert.equal(state.day, 1);
assert.equal(state.time, 3);
assert.equal(state.visited.length, 0);

for (const place of context.TRI_DAY_ONE.places) {
  state = context.TriDayOne.visit(state, place.id);
  assert.equal(state.currentPlace, place.id);
  state = context.TriDayOne.choose(state, 'listen');
}

assert.equal(state.time, 0);
assert.equal(state.finished, true);
assert.equal(state.visited.length, 3);
assert.equal(state.journal.length, 4);
assert.equal(context.TriDayOne.get().finished, true);

state = context.TriDayOne.nextDay(state);
assert.equal(state.day, 2);
assert.equal(state.time, 3);
assert.equal(state.finished, false);
assert.equal(state.visited.length, 0);
assert.equal(state.journal[0].title, '2日目の朝');
assert.equal(state.bonds['船頭のトワ'], 1);
assert.equal(state.bonds['パン屋のセナ'], 1);
assert.equal(state.bonds['記録係のミオ'], 1);

console.log('day-one engine: ok');
