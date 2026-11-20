/* HIYOKO 社内資料の管理（オーナーだけ）。関係者（メール）の追加・解除と、資料の登録。
   判定はサーバー（hibiki-sync の /hiyoko/*、towananika/hibiki の worker/hiyoko.js）。画面の出しわけは見た目だけ。 */
(function () {
  'use strict';
  var API = 'https://hibiki-sync.jaykim-can.workers.dev/hiyoko/';
  var gate = document.getElementById('gate'), body = document.getElementById('admin-body'), done = false;
  var DOCS = [['strategy', '企画・目標・方向性'], ['review', '振り返り']];
  function say(html) { gate.innerHTML = html; gate.hidden = false; body.hidden = true; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function day(t) { return t ? new Date(t).toLocaleString('ja-JP') : ''; }
  function call(action, data) {
    return window.triToken().then(function (tk) {
      return fetch(API + action, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk }, body: JSON.stringify(data || {}) });
    }).then(function (r) { return r.json().catch(function () { return { error: 'http' + r.status }; }); });
  }
  var MSG = { forbidden: '権限がありません', bad_email: 'メールの形がちがいます', too_big: 'ファイルが大きすぎます（900KBまで）', too_many: '人数が多すぎます', login: 'ログインし直してください' };
  function err(e) { return MSG[e] || e || 'エラー'; }

  function drawMembers(list) {
    var box = document.getElementById('members'); box.replaceChildren();
    list.forEach(function (email) {
      var tr = document.createElement('tr'), td = document.createElement('td'), td2 = document.createElement('td'), b = document.createElement('button');
      td.textContent = email; b.type = 'button'; b.className = 'gate-btn ghost'; b.textContent = '関係者から外す';
      b.onclick = function () {
        if (!window.confirm(email + ' を関係者から外しますか？')) return;
        b.disabled = true;
        call('member', { email: email, on: false }).then(function (o) { if (o.error) { b.disabled = false; note(err(o.error)); } else drawMembers(o.members); });
      };
      td2.appendChild(b); tr.appendChild(td); tr.appendChild(td2); box.appendChild(tr);
    });
    document.getElementById('mcount').textContent = '関係者 ' + list.length + '人';
  }
  function note(t) { document.getElementById('mnote').textContent = t; }
  function drawDocs(docs) {
    var box = document.getElementById('docs'); box.replaceChildren();
    DOCS.forEach(function (d) {
      var cur = docs[d[0]], row = document.createElement('div'); row.className = 'adm-row';
      row.innerHTML = '<div><b>' + d[1] + '</b><small data-st></small></div><label class="gate-btn ghost">HTMLを選んで登録<input type="file" accept=".html,text/html" hidden></label>';
      var st = row.querySelector('[data-st]');
      st.textContent = cur ? '登録済み・更新 ' + day(cur.at) : 'まだ登録されていません';
      row.querySelector('input').addEventListener('change', function (ev) {
        var file = ev.target.files[0]; ev.target.value = ''; if (!file) return;
        st.textContent = '登録しています…';
        file.text().then(function (html) { return call('put', { id: d[0], html: html }); })
          .then(function (o) { st.textContent = o.error ? '登録できませんでした（' + err(o.error) + '）' : '登録しました（' + file.name + '）'; })
          .catch(function () { st.textContent = '登録できませんでした（通信）'; });
      });
      box.appendChild(row);
    });
  }
  document.getElementById('madd').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('memail'), v = input.value.trim(); if (!v) return;
    call('member', { email: v, on: true }).then(function (o) { if (o.error) note(err(o.error)); else { input.value = ''; note(''); drawMembers(o.members); } });
  });

  function on(u) {
    if (!u) { done = false; say('<p class="gate-msg">このページは管理者だけが使えます。</p><button type="button" class="gate-btn" data-login>Googleでログイン</button>');
      gate.querySelector('[data-login]').onclick = function () { window.triLogin && window.triLogin('google'); }; return; }
    if (done) return;
    say('<p class="gate-msg">確認しています…</p>');
    call('list').then(function (o) {
      if (o.error === 'forbidden') { say('<p class="gate-msg">' + esc(u.email) + ' は管理者ではありません。</p>'); return; }
      if (o.error) { say('<p class="gate-msg">読み込めませんでした（' + esc(err(o.error)) + '）。</p>'); return; }
      done = true; gate.hidden = true; body.hidden = false; drawMembers(o.members); drawDocs(o.docs);
    }).catch(function () { say('<p class="gate-msg">サーバーにつながりませんでした。少し待ってから開き直してください。</p>'); });
  }
  say('<p class="gate-msg">確認しています…</p>');
  document.addEventListener('tri-user', function (e) { on(e.detail); });
  import('/triathlon/login/auth.js?v=0.28').then(function () { if (window.TRI_USER !== undefined) on(window.TRI_USER); })
    .catch(function () { say('<p class="gate-msg">ログインの仕組みを読み込めませんでした。</p>'); });
})();
