const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const store = Object.create(null);
const context = { JSON, localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } } };
context.window = context;
vm.createContext(context);
['content.js', 'engine.js'].forEach((file) => vm.runInContext(fs.readFileSync(__dirname + '/' + file, 'utf8'), context, { filename: file }));
let state = context.TriLearn.start();
assert.equal(context.TriLearn.current(state).id, 'observe');
for (const lesson of context.TRI_LEARN.lessons) {
  const correct = lesson.choices.filter((choice) => choice.correct)[0];
  state = context.TriLearn.answer(state, correct.id);
  assert.equal(state.answers.length, state.index + 1);
  state = context.TriLearn.next(state);
}
assert.equal(state.finished, true);
assert.equal(state.score, context.TRI_LEARN.lessons.length);
assert.equal(context.TriLearn.get().finished, true);
console.log('learn engine: ok');
