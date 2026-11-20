/* HIYOKO 社内資料の管理（管理者だけ）。関係者の追加・解除と、資料の登録。
   守りは Firebase のルール側。ここで管理者でなければ読み書きが拒否される。 */
(function () {
  'use strict';
  var gate = document.getElementById('gate'), body = document.getElementById('admin-body'), done = false, F = null;
  var DOCS = [['strategy', '企画・目標・方向性'], ['review', '振り返り']];
  function say(html) { gate.innerHTML = html; gate.hidden = false; body.hidden = true; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function day(t) { return t && t.toDate ? t.toDate().toLocaleDateString('ja-JP') : ''; }

  function loadDocs() {
    var box = document.getElementById('docs'); box.replaceChildren();
    DOCS.forEach(function (d) {
      var row = document.createElement('div'); row.className = 'adm-row';
      row.innerHTML = '<div><b>' + d[1] + '</b><small data-st>確認中…</small></div><label class="gate-btn ghost">HTMLを選んで登録<input type="file" accept=".html,text/html" hidden></label>';
      box.appendChild(row);
      var st = row.querySelector('[data-st]');
      F.getDoc(F.doc(F.db, 'hiyokoDocs', d[0])).then(function (s) { st.textContent = s.exists() ? '登録済み・更新 ' + day(s.data().at) : 'まだ登録されていません'; })
        .catch(function (e) { st.textContent = '読めません（' + (e.code || 'error') + '）'; });
      row.querySelector('input').addEventListener('change', function (ev) {
        var file = ev.target.files[0]; if (!file) return;
        if (file.size > 900000) { st.textContent = 'ファイルが大きすぎます（900KBまで）'; return; }
        st.textContent = '登録しています…';
        file.text().then(function (html) {
          var m = html.match(/<title>([^<]*)<\/title>/i);
          return F.setDoc(F.doc(F.db, 'hiyokoDocs', d[0]), { html: html, title: m ? m[1] : d[1], at: F.serverTimestamp(), by: window.triUid() });
        }).then(function () { st.textContent = '登録しました（' + file.name + '）'; })
          .catch(function (e) { st.textContent = '登録できませんでした（' + (e.code || 'error') + '）'; });
        ev.target.value = '';
      });
    });
  }

  function loadMembers() {
    var box = document.getElementById('members'), cnt = document.getElementById('mcount');
    Promise.all([F.getDocs(F.query(F.collection(F.db, 'users'), F.orderBy('last', 'desc'), F.limit(200))), F.getDocs(F.collection(F.db, 'hiyokoMembers'))]).then(function (r) {
      var mem = new Set(); r[1].forEach(function (d) { mem.add(d.id); });
      box.replaceChildren();
      r[0].forEach(function (d) {
        var u = d.data(), tr = document.createElement('tr');
        [u.name || '（名前なし）', u.email || '', day(u.last)].forEach(function (v) { var td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
        var td = document.createElement('td'), on = mem.has(d.id), b = document.createElement('button');
        b.type = 'button'; b.className = on ? 'gate-btn ghost' : 'gate-btn'; b.textContent = on ? '関係者から外す' : '関係者にする';
        b.onclick = function () {
          if (!window.confirm((u.email || u.name) + ' を' + (on ? '関係者から外し' : '関係者に')+ 'ますか？')) return;
          b.disabled = true;
          var ref = F.doc(F.db, 'hiyokoMembers', d.id);
          (on ? F.deleteDoc(ref) : F.setDoc(ref, { email: u.email || '', name: u.name || '', grantedBy: window.triUid(), at: F.serverTimestamp() }))
            .then(loadMembers).catch(function (e) { b.disabled = false; cnt.textContent = '変更できませんでした（' + (e.code || 'error') + '）'; });
        };
        td.appendChild(b); tr.appendChild(td); box.appendChild(tr);
      });
      cnt.textContent = '関係者 ' + mem.size + '人 ／ ログイン履歴のある利用者 ' + r[0].size + '人（最大200人）';
    }).catch(function (e) { cnt.textContent = '読み込めませんでした（' + (e.code || 'error') + '）'; });
  }

  function on(u) {
    if (!u) { done = false; say('<p class="gate-msg">このページは管理者だけが使えます。</p><button type="button" class="gate-btn" data-login>Googleでログイン</button>');
      gate.querySelector('[data-login]').onclick = function () { window.triLogin && window.triLogin('google'); }; return; }
    if (done) return;
    say('<p class="gate-msg">確認しています…</p>');
    window.triDB().then(function (f) { F = f; return f.getDocs(f.collection(f.db, 'hiyokoMembers')); }).then(function () {
      done = true; gate.hidden = true; body.hidden = false; loadDocs(); loadMembers();
    }).catch(function (e) {
      if (e && e.code === 'permission-denied') say('<p class="gate-msg">' + esc(u.email) + ' は管理者ではありません。</p>');
      else say('<p class="gate-msg">まだ準備中です（データベースのルール設定待ち：' + esc(e && e.code || 'エラー') + '）。</p>');
    });
  }
  say('<p class="gate-msg">確認しています…</p>');
  document.addEventListener('tri-user', function (e) { on(e.detail); });
  import('/triathlon/login/auth.js?v=0.28').then(function () { if (window.TRI_USER !== undefined) on(window.TRI_USER); })
    .catch(function () { say('<p class="gate-msg">ログインの仕組みを読み込めませんでした。</p>'); });
})();
