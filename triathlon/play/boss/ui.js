/* 画面だけ。 */
(function () {
  'use strict';
  var C = window.TRI_BOSS, E = window.TriBoss, app = document.getElementById('app'), s = null;
  function bar(v, max, cls) { return '<span class="bar ' + cls + '"><i style="width:' + Math.round(v / max * 100) + '%"></i></span>'; }
  function intro() {
    app.innerHTML = '<section class="card intro"><p class="eyebrow">試作 · ボス戦</p><h1>ボスをたおそう</h1>' +
      '<ol class="how"><li><b>攻撃</b>すると MP が 10 たまる</li><li>MP が 30 になると <b>スキル</b>が使える</li><li>ボスの体力を 0 にすれば <b>ボスクリア</b></li></ol>' +
      '<button class="primary" id="go" type="button">戦いをはじめる</button><p class="note">数値はすべて仮です。記録は残りません。</p></section>';
    document.getElementById('go').onclick = function () { s = E.start(); render(); };
  }
  function member(m, i) {
    var d = E.def(m.id), now = !s.result && i === s.turn, cost = d.skill.cost;
    return '<div class="mem' + (now ? ' now' : '') + (m.hp === 0 ? ' down' : '') + '" style="--c:' + d.color + '">' +
      '<b>' + d.name + '</b><small>' + d.cls + '</small>' +
      '<span class="lbl">HP ' + m.hp + '</span>' + bar(m.hp, m.max, 'hp') +
      '<span class="lbl">MP ' + m.mp + '/' + cost + '</span>' + bar(m.mp, cost, 'mp' + (m.mp >= cost ? ' full' : '')) + '</div>';
  }
  function render() {
    var m = s.party[s.turn], d = E.def(m.id), ok = E.canSkill(s), end = '';
    if (s.result === 'win') end = '<section class="card end win"><h2>ボスクリア！</h2><p>' + s.round + 'ラウンドでたおしました。</p><button class="primary" id="again" type="button">もう一度</button></section>';
    if (s.result === 'lose') end = '<section class="card end"><h2>全員が倒れた</h2><p>スキルの使いどころを変えて、もう一度。</p><button class="primary" id="again" type="button">もう一度</button></section>';
    app.innerHTML =
      '<section class="card boss"><div class="row"><b>' + C.boss.name + '</b><span>ラウンド ' + s.round + (s.guard ? ' · 🛡 守り中' : '') + '</span></div>' +
      '<span class="lbl">HP ' + s.boss.hp + ' / ' + s.boss.max + '</span>' + bar(s.boss.hp, s.boss.max, 'boss') +
      '<p class="big">' + (C.boss.bigEvery - (s.round - 1) % C.boss.bigEvery === 1 ? '⚠ このラウンドの終わりに大技がくる' : '大技まで あと ' + (C.boss.bigEvery - (s.round - 1) % C.boss.bigEvery) + ' ラウンド') + '</p></section>' +
      '<section class="party">' + s.party.map(member).join('') + '</section>' +
      (end || '<section class="card act"><p><b>' + d.name + '</b> の番</p><div class="btns">' +
        '<button class="primary" id="atk" type="button">攻撃<small>MP +' + C.mpPerAttack + '</small></button>' +
        '<button class="skill" id="sk" type="button"' + (ok ? '' : ' disabled') + '>' + d.skill.name + '<small>' + (ok ? d.skill.text : 'MP ' + d.skill.cost + ' で使える') + '</small></button></div></section>') +
      '<section class="card log"><ol>' + s.log.slice(0, 6).map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol></section>';
    var a = document.getElementById('atk'), k = document.getElementById('sk'), g = document.getElementById('again');
    if (a) a.onclick = function () { E.attack(s); render(); };
    if (k) k.onclick = function () { E.skill(s); render(); };
    if (g) g.onclick = function () { s = E.start(); render(); };
  }
  intro();
})();
