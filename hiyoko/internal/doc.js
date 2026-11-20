/* HIYOKO 社内資料：統合ログイン（/triathlon/login/auth.js）で本人を確かめ、
   中身は Firestore の hiyokoDocs/{id} から読む。読めるかどうかは Firebase のルールが決める
   （画面の出しわけは見た目だけ。中身はリポジトリに置かない）。
   使い方：<div id="gate" data-doc="strategy"></div><div id="doc-body" hidden></div> */
(function () {
  'use strict';
  var gate = document.getElementById('gate'), body = document.getElementById('doc-body');
  var id = gate.getAttribute('data-doc'), shown = null;
  function say(html) { gate.innerHTML = html; gate.hidden = false; body.hidden = true; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function loginBtn() {
    var b = gate.querySelector('[data-login]');
    if (b) b.addEventListener('click', function () {
      if (window.triLogin) window.triLogin('google').catch(function () { say('<p class="gate-msg">ログインできませんでした。もう一度お試しください。</p><button type="button" class="gate-btn" data-login>Googleでログイン</button>'); loginBtn(); });
    });
  }
  // 中身は別の窓（sandbox の iframe）で表示し、このサイトのログイン情報には触れさせない
  var FIT = '<script>(function(){function s(){parent.postMessage({hiyokoDocHeight:document.documentElement.scrollHeight},"*");}' +
    'addEventListener("load",s);addEventListener("resize",s);new MutationObserver(s).observe(document.documentElement,{subtree:true,childList:true,attributes:true});' +
    'document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(a&&!/^#/.test(a.getAttribute("href")))a.target="_blank";});setInterval(s,1500);})();<\/script>';
  function render(d) {
    var html = String(d.html || '');
    html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, FIT + '</body>') : html + FIT;
    var f = document.createElement('iframe');
    f.className = 'doc-frame'; f.title = d.title || '社内資料';
    f.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
    f.srcdoc = html;
    body.replaceChildren(f);
    var meta = document.getElementById('doc-meta');
    if (meta && d.at && d.at.toDate) meta.textContent = '更新：' + d.at.toDate().toLocaleDateString('ja-JP');
    gate.hidden = true; body.hidden = false;
  }
  window.addEventListener('message', function (e) {
    var f = body.querySelector('iframe');
    if (f && e.source === f.contentWindow && e.data && e.data.hiyokoDocHeight) f.style.height = Math.min(e.data.hiyokoDocHeight + 8, 40000) + 'px';
  });
  function on(u) {
    if (!u) { shown = null; body.replaceChildren(); say('<p class="gate-msg">関係者だけが見られるページです。ログインしてください。</p><button type="button" class="gate-btn" data-login>Googleでログイン</button>'); loginBtn(); return; }
    if (shown === u.email) return;
    say('<p class="gate-msg">確認しています…</p>');
    window.triDB().then(function (f) { return f.getDoc(f.doc(f.db, 'hiyokoDocs', id)); }).then(function (snap) {
      shown = u.email;
      if (!snap.exists()) { say('<p class="gate-msg">この資料はまだ登録されていません。</p>'); return; }
      render(snap.data());
    }).catch(function (err) {
      var c = err && err.code || '';
      if (c === 'permission-denied') say('<p class="gate-msg">' + esc(u.email) + ' には、この資料を見る権限がありません。管理者に関係者として追加してもらってください。</p><button type="button" class="gate-btn ghost" data-logout>別のアカウントでログイン</button>');
      else say('<p class="gate-msg">読み込めませんでした（' + esc(c || 'エラー') + '）。</p>');
      var lo = gate.querySelector('[data-logout]'); if (lo) lo.addEventListener('click', function () { window.triLogout && window.triLogout(); });
    });
  }
  say('<p class="gate-msg">確認しています…</p>');
  document.addEventListener('tri-user', function (e) { on(e.detail); });
  import('/triathlon/login/auth.js?v=0.28').then(function () { if (window.TRI_USER !== undefined) on(window.TRI_USER); })
    .catch(function () { say('<p class="gate-msg">ログインの仕組みを読み込めませんでした。</p>'); });
})();
