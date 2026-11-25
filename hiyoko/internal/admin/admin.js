/* HIYOKO 社内資料の管理（オーナーだけ）。関係者（メール）の追加・解除と、資料の登録。
   判定はサーバー（hibiki-sync の /hiyoko/*、towananika/towananika.github.io の hibiki/worker/hiyoko.js）。画面の出しわけは見た目だけ。 */
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

  var NAMES = {};
  var SITE = 'https://towananika.github.io/hiyoko/join/';
  function drawInvite(code) {
    document.getElementById('inv-code').textContent = code || '受付停止中';
    document.getElementById('inv-st').textContent = code ? '招待リンク：' + SITE + '#' + code : 'コードを作ると登録を受けつけます';
    document.getElementById('inv-make').textContent = code ? 'コードを作り直す' : 'コードを作る';
    document.getElementById('inv-copy').hidden = !code; document.getElementById('inv-off').hidden = !code;
    document.getElementById('inv-link').href = '../../join/' + (code ? '#' + code : '');
    document.getElementById('inv-copy').onclick = function () {
      var t = SITE + '#' + code, b = this;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'コピーしました'; }, function () { window.prompt('このリンクを送ってください', t); });
    };
  }
  document.getElementById('inv-make').onclick = function () {
    if (this.textContent.indexOf('作り直す') >= 0 && !window.confirm('今のコードは使えなくなります。作り直しますか？（登録ずみの人はそのままです）')) return;
    call('invite', {}).then(function (o) { if (o.error) window.alert(err(o.error)); else drawInvite(o.invite); });
  };
  document.getElementById('inv-off').onclick = function () {
    if (!window.confirm('新しい登録の受付を止めますか？（登録ずみの人はそのままです）')) return;
    call('invite', { off: true }).then(function (o) { if (o.error) window.alert(err(o.error)); else drawInvite(''); });
  };
  function drawAis(list) {
    var box = document.getElementById('ais'); box.replaceChildren();
    if (!list.length) { var tr0 = document.createElement('tr'), td0 = document.createElement('td'); td0.colSpan = 3; td0.textContent = 'まだいません'; tr0.appendChild(td0); box.appendChild(tr0); }
    list.forEach(function (a) {
      var tr = document.createElement('tr'), t1 = document.createElement('td'), t2 = document.createElement('td'), t3 = document.createElement('td'), b = document.createElement('button');
      t1.textContent = a.name; t2.textContent = new Date(a.at).toLocaleDateString('ja-JP');
      b.type = 'button'; b.className = 'gate-btn ghost'; b.textContent = '止める';
      b.onclick = function () {
        if (!window.confirm(a.name + ' の鍵を止めますか？')) return;
        call('ai_off', { id: a.id }).then(function (o) { if (o.error) window.alert(err(o.error)); else drawAis(o.ais); });
      };
      t3.appendChild(b); tr.appendChild(t1); tr.appendChild(t2); tr.appendChild(t3); box.appendChild(tr);
    });
  }
  function drawMembers(list) {
    var box = document.getElementById('members'); box.replaceChildren();
    list.forEach(function (email) {
      var tr = document.createElement('tr'), td = document.createElement('td'), td2 = document.createElement('td'), b = document.createElement('button');
      var tdn = document.createElement('td'); tdn.textContent = NAMES[email] || '';
      td.textContent = email; b.type = 'button'; b.className = 'gate-btn ghost'; b.textContent = '関係者から外す';
      b.onclick = function () {
        if (!window.confirm(email + ' を関係者から外しますか？')) return;
        b.disabled = true;
        call('member', { email: email, on: false }).then(function (o) { if (o.error) { b.disabled = false; note(err(o.error)); } else drawMembers(o.members); });
      };
      td2.appendChild(b); tr.appendChild(td); tr.appendChild(tdn); tr.appendChild(td2); box.appendChild(tr);
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
      done = true; gate.hidden = true; body.hidden = false; NAMES = o.names || {}; drawInvite(o.invite || ''); drawAis(o.ais || []); drawMembers(o.members); drawDocs(o.docs);
    }).catch(function () { say('<p class="gate-msg">サーバーにつながりませんでした。少し待ってから開き直してください。</p>'); });
  }
  say('<p class="gate-msg">確認しています…</p>');
  document.addEventListener('tri-user', function (e) { on(e.detail); });
  import('/triathlon/login/auth.js?v=0.28').then(function () { if (window.TRI_USER !== undefined) on(window.TRI_USER); })
    .catch(function () { say('<p class="gate-msg">ログインの仕組みを読み込めませんでした。</p>'); });
})();
