/* ボス戦の状態と計算だけ。画面は ui.js。 */
(function () {
  'use strict';
  var C = window.TRI_BOSS;
  function rnd() { return Math.random(); }
  function start() {
    return {
      round: 1, turn: 0, guard: false, result: null,
      party: C.party.map(function (p) { return { id: p.id, hp: p.hp, max: p.hp, mp: 0 }; }),
      boss: { hp: C.boss.hp, max: C.boss.hp },
      log: ['ボスが現れた。3人で力を合わせよう。']
    };
  }
  function def(id) { return C.party.filter(function (p) { return p.id === id; })[0]; }
  function alive(s) { return s.party.filter(function (m) { return m.hp > 0; }); }
  function canSkill(s) {
    var m = s.party[s.turn]; return !!m && !s.result && m.mp >= def(m.id).skill.cost;
  }
  // 次に動ける仲間へ。全員動いたらボスの番。
  function advance(s) {
    if (s.boss.hp <= 0) { s.result = 'win'; s.log.unshift('ボスクリア！'); return s; }
    for (var i = s.turn + 1; i < s.party.length; i++) if (s.party[i].hp > 0) { s.turn = i; return s; }
    bossAct(s);
    if (s.result) return s;
    s.round += 1; s.turn = 0;
    while (s.party[s.turn].hp <= 0) s.turn += 1;
    return s;
  }
  function hit(s, m, dmg) {
    if (s.guard) dmg = Math.ceil(dmg / 2);
    m.hp = Math.max(0, m.hp - dmg);
    s.log.unshift(def(m.id).name + 'に ' + dmg + ' のダメージ' + (m.hp === 0 ? '。倒れた……' : '。'));
  }
  function bossAct(s) {
    var a = alive(s);
    if (s.round % C.boss.bigEvery === 0) {
      s.log.unshift('ボスの大技！ 全員をまきこむ。');
      a.forEach(function (m) { hit(s, m, C.boss.bigAtk); });
    } else {
      var t = a[Math.floor(rnd() * a.length)];
      hit(s, t, C.boss.atk + Math.floor(rnd() * 5));
    }
    s.guard = false;
    if (!alive(s).length) { s.result = 'lose'; s.log.unshift('全員が倒れた。もう一度挑もう。'); }
  }
  function attack(s) {
    if (s.result) return s;
    var m = s.party[s.turn], d = def(m.id), dmg = d.atk + Math.floor(rnd() * 4);
    s.boss.hp = Math.max(0, s.boss.hp - dmg);
    m.mp = Math.min(d.skill.cost, m.mp + C.mpPerAttack);
    s.log.unshift(d.name + 'の攻撃。ボスに ' + dmg + '。MP +' + C.mpPerAttack);
    return advance(s);
  }
  function skill(s) {
    if (!canSkill(s)) return s;
    var m = s.party[s.turn], d = def(m.id);
    m.mp = 0;
    if (d.skill.id === 'smash') {
      var dmg = d.atk * 3 + Math.floor(rnd() * 6);
      s.boss.hp = Math.max(0, s.boss.hp - dmg);
      s.log.unshift(d.name + '「' + d.skill.name + '」！ ボスに ' + dmg + '。');
    } else if (d.skill.id === 'guard') {
      s.guard = true;
      s.log.unshift(d.name + '「' + d.skill.name + '」。次の攻撃は半分になる。');
    } else if (d.skill.id === 'heal') {
      alive(s).forEach(function (x) { x.hp = Math.min(x.max, x.hp + 25); });
      s.log.unshift(d.name + '「' + d.skill.name + '」。みんなの体力が 25 戻った。');
    }
    return advance(s);
  }
  window.TriBoss = { start: start, attack: attack, skill: skill, canSkill: canSkill, def: def };
})();
