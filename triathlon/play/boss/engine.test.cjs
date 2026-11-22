/* ボス戦の状態遷移と、遊びのバランス（仮）を確かめる。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load(seed) {
  let x = seed;
  const ctx = { Math: Object.create(Math), JSON };
  ctx.Math.random = () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
  ctx.window = ctx; vm.createContext(ctx);
  ['content.js', 'engine.js'].forEach((f) => vm.runInContext(fs.readFileSync(__dirname + '/' + f, 'utf8'), ctx, { filename: f }));
  return ctx.TriBoss;
}
// 1. 攻撃でMPがたまり、30でスキルが使える
let E = load(1), s = E.start();
assert.equal(E.canSkill(s), false);
E.attack(s); assert.equal(s.party[0].mp, 10); assert.equal(s.turn, 1);
E.attack(s); E.attack(s);              // ラウンド1終わり → ボスの番
assert.equal(s.round, 2);
E.attack(s); E.attack(s); E.attack(s); E.attack(s); E.attack(s); E.attack(s);
const a = s.party[0];
if (a.hp > 0) { assert.equal(a.mp, 30); assert.equal(E.canSkill(s), s.turn === 0); }
// 2. スキルを使うとMPは0
s = E.start(); s.party[0].mp = 30; const hp = s.boss.hp; E.skill(s);
assert.equal(s.party[0].mp, 0); assert.ok(s.boss.hp < hp);
// 3. MPが足りないとスキルは何も起きない
s = E.start(); const before = JSON.stringify(s); E.skill(s); assert.equal(JSON.stringify(s), before);
// 4. 勝ち負けとバランス：攻撃だけより、スキルを使うほうが勝ちやすい
function play(seed, smart) {
  const E = load(seed), s = E.start();
  for (let i = 0; i < 500 && !s.result; i++) (smart && E.canSkill(s) ? E.skill : E.attack)(s);
  return s.result;
}
let dumb = 0, smart = 0;
for (let k = 1; k <= 200; k++) { if (play(k, false) === 'win') dumb++; if (play(k, true) === 'win') smart++; }
console.log('攻撃だけの勝率', dumb / 2, '% / スキルを使う勝率', smart / 2, '%');
assert.ok(smart > dumb, 'スキルを使うほうが勝ちやすい');
assert.ok(smart >= 60 && dumb <= 60, 'ほどよい難しさ');
console.log('ok');
