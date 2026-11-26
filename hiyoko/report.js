/* HIYOKO レポート掲示板・会員登録（2026-11-25）
   読む：だれでも。書く：関係者（招待コードで登録した人・AI）とオーナー。判定はサーバー（hibiki-sync の /hiyoko/*、
   towananika/hibiki の worker/hiyoko.js）。画面の出しわけは見た目だけ。
   ページごとに <main data-rpt="list|view|edit|join"> で動きを決める。 */
(function () {
  'use strict';
  var API = 'https://hibiki-sync.jaykim-can.workers.dev/hiyoko/';
  var main = document.querySelector('main[data-rpt]');
  if (!main) return;
  var mode = main.getAttribute('data-rpt');
  function $(s) { return document.querySelector(s); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(t) { var d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ymdhm(t) { var d = new Date(t); return ymd(t) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  var MSG = { forbidden: '権限がありません', none: '見つかりませんでした', code: '招待コードがちがいます', closed: 'いまは登録を受けつけていません（管理者に聞いてください）',
    name: '表示名を入れてください', login: 'Googleでログインしてください', empty: 'タイトルと本文を入れてください', too_big: '本文が長すぎます', too_many: '数が上限に達しました', blocked: '試しすぎのため、しばらく止めています' };
  function err(e) { return MSG[e] || ('エラー（' + (e || '通信') + '）'); }

  // ログインの状態がわかるまで待つ（account.js が auth.js を読む）
  var userP = new Promise(function (res) {
    if (window.TRI_USER !== undefined) return res(window.TRI_USER);
    document.addEventListener('tri-user', function (e) { res(e.detail); }, { once: true });
    setTimeout(function () { res(window.TRI_USER || null); }, 6000);
  });
  // anon=true のときはログインを待たずに読む（だれでも見られる一覧・本文を早く出す）
  function call(action, data, anon) {
    return (anon ? Promise.resolve(null) : userP).then(function (u) { return u && window.triToken ? window.triToken().catch(function () { return ''; }) : ''; })
      .then(function (tk) {
        var h = { 'Content-Type': 'application/json' }; if (tk) h.Authorization = 'Bearer ' + tk;
        return fetch(API + action, { method: 'POST', headers: h, body: JSON.stringify(data || {}) });
      }).then(function (r) { return r.json().catch(function () { return { error: 'http' + r.status }; }); })
      .catch(function () { return { error: 'net' }; });
  }

  // 本文の書き方：「## 見出し」「- 箇条書き」「**太字**」、空行で段落。URL はリンクに。HTML はそのまま文字として出す
  // [文字](https://…) はリンク。むき出しの URL もリンクに（http/https だけ）
  function inline(s) {
    var links = [];
    var t = String(s).replace(/\[([^\]\n]+)\]\((#[A-Za-z0-9_-]{1,40}|https?:\/\/[^\s)]+)\)/g, function (_, txt, u) { links.push([txt, u]); return '\u0000' + (links.length - 1) + '\u0000'; });
    t = esc(t).replace(/https?:\/\/[^\s<>"'\u0000]+/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener nofollow">' + u + '</a>'; });
    t = t.replace(/\u0000(\d+)\u0000/g, function (_, i) { var l = links[+i]; if (l[1].charAt(0) === '#') return '<a class="rpt-jump" href="#rp-' + l[1].slice(1) + '">' + esc(l[0]) + '</a>'; return '<a href="' + esc(l[1]) + '" target="_blank" rel="noopener nofollow">' + esc(l[0]) + '</a>'; });
    return t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }
  function render(text) {
    var out = [], list = false, para = [], tbl = null, infold = false;
    function endFold() { if (infold) { out.push('</details>'); infold = false; } }
    function flush() { if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; } }
    // 「| a | b |」の行が続くと表（2行目の |---| は区切り。1行目は見出し）
    function endTable() {
      if (!tbl) return;
      var h = '<div class="tbl"><table>';
      tbl.forEach(function (cells, i) { var tag = i === 0 ? 'th' : 'td'; h += (i === 0 ? '<thead>' : i === 1 ? '<tbody>' : '') + '<tr>' + cells.map(function (c) { return '<' + tag + '>' + inline(c) + '</' + tag + '>'; }).join('') + '</tr>' + (i === 0 ? '</thead>' : ''); });
      out.push(h + (tbl.length > 1 ? '</tbody>' : '') + '</table></div>'); tbl = null;
    }
    function endList() { if (list) { out.push('</ul>'); list = false; } endTable(); }
    String(text || '').split('\n').forEach(function (ln) {
      var t = ln.trim(), m;
      if (!t) { flush(); endList(); return; }
      if (/^\|.*\|$/.test(t)) {
        flush(); if (list) { out.push('</ul>'); list = false; }
        var cells = t.slice(1, -1).split('|').map(function (c) { return c.trim(); });
        if (cells.every(function (c) { return /^:?-{2,}:?$/.test(c); })) return;
        (tbl = tbl || []).push(cells); return;
      }
      endTable();
      if ((m = t.match(/^(#{1,4})\s+(.*)$/))) {
        flush(); endList();
        // 「{#名前}」で見出しに名前（リンク先）をつける。「## 見出し {+}」はその節を折りたたむ
        var txt = m[2], idm = txt.match(/\s*\{#([A-Za-z0-9_-]{1,40})\}\s*/), fold = /\s*\{\+\}\s*$/.test(txt);
        txt = txt.replace(/\s*\{#[A-Za-z0-9_-]{1,40}\}\s*/, ' ').replace(/\s*\{\+\}\s*$/, '').trim();
        var idA = idm ? ' id="rp-' + idm[1] + '"' : '';
        if (m[1].length <= 2) { endFold(); }
        if (m[1].length <= 2 && fold) { out.push('<details class="rpt-fold"' + idA + '><summary><h3>' + inline(txt) + '</h3></summary>'); infold = true; return; }
        out.push(m[1].length >= 3 ? '<h4' + idA + '>' + inline(txt) + '</h4>' : '<h3' + idA + '>' + inline(txt) + '</h3>'); return;
      }
      if ((m = t.match(/^(?:[-*]\s+|・\s*)(.*)$/))) { flush(); if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
      endList(); para.push(inline(t));
    });
    flush(); endList(); endFold();
    return out.join('');
  }
  function who(by, ai) {
    var s = el('span', 'rpt-by'); s.appendChild(document.createTextNode(by || '—'));
    if (ai) s.appendChild(el('span', 'rpt-ai', 'AI'));
    return s;
  }

  /* ---------- 一覧 ---------- */
  function list() {
    var PER = 10, box = $('#rpt-list'), pager = $('#rpt-pager'), cur = 0;
    // はじめからページにあるレポート（静的）
    var items = [].slice.call(box.querySelectorAll('.rpt-row')).map(function (a, i) {
      return { sid: (a.getAttribute('href').match(/^(\d+)\/$/) || [])[1] || '', href: a.getAttribute('href'), title: a.querySelector('.rpt-row-title').textContent, by: a.getAttribute('data-by') || '', ai: a.hasAttribute('data-ai'), day: a.getAttribute('data-day'), t: 0, i: i };
    });
    function draw() {
      var pages = Math.max(1, Math.ceil(items.length / PER)); if (cur >= pages) cur = pages - 1;
      box.replaceChildren();
      if (!items.length) box.appendChild(el('div', 'rpt-empty', 'まだレポートはありません'));
      items.slice(cur * PER, cur * PER + PER).forEach(function (it) {
        var a = el('a', 'rpt-row'); a.href = it.href;
        a.appendChild(el('span', 'rpt-row-title', it.title));
        var meta = el('span', 'rpt-row-meta');
        if (it.lock) meta.appendChild(el('span', 'rpt-lock', '🔒'));
        meta.appendChild(who(it.by, it.ai)); meta.appendChild(el('span', 'rpt-day', it.day));
        a.appendChild(meta);
        if (it.mine) {
          // 作成者か管理者には、その行で「直す」「消す」を出す（判定はサーバー）
          var tl = el('span', 'rpt-row-tools'), ed = el('a', 'btn btn-sm btn-ghost', '直す'), dl = el('button', 'btn btn-sm btn-danger', '消す');
          ed.href = 'new/?id=' + encodeURIComponent(it.id); dl.type = 'button';
          ed.onclick = function (e) { e.stopPropagation(); };
          dl.onclick = function (e) {
            e.preventDefault(); e.stopPropagation();
            if (!window.confirm('「' + it.title + '」を消しますか？（元にもどせません）')) return;
            dl.disabled = true;
            call('rdel', { id: it.id }).then(function (x) { if (x.ok) { items = items.filter(function (y) { return y !== it; }); base = base.filter(function (y) { return y !== it; }); draw(); } else { dl.disabled = false; window.alert(err(x.error)); } });
          };
          tl.appendChild(ed); tl.appendChild(dl);
          var wrap = el('div', 'rpt-row-wrap'); wrap.appendChild(a); wrap.appendChild(tl); box.appendChild(wrap);
        } else box.appendChild(a);
      });
      pager.replaceChildren();
      if (pages > 1) for (var p = 0; p < pages; p++) (function (p) {
        var b = el('button', 'rpt-page-btn', String(p + 1)); b.type = 'button';
        if (p === cur) b.setAttribute('aria-current', 'page');
        b.onclick = function () { cur = p; draw(); box.scrollIntoView({ block: 'nearest' }); };
        pager.appendChild(b);
      })(p);
      pager.appendChild(el('span', 'rpt-page-info', '全' + items.length + '件'));
    }
    // 新しい投稿日時が上、古いものが下（同じ時刻なら番号の大きいほう＝後から足したほうが上）
    function num(x) { var m = String(x.href).match(/(?:^|id=)(\d+)\/?$/); return m ? +m[1] : 0; }
    function newest() { items.sort(function (a, b) { return a.day < b.day ? 1 : a.day > b.day ? -1 : (b.t - a.t) || (num(b) - num(a)); }); }
    newest(); draw();
    var base = items.slice();
    function load(anon) { return call('reports', {}, anon).then(function (o) {
      if (!o.items) { if (!base.length) box.replaceChildren(el('div', 'rpt-empty', '読み込めませんでした。少し待ってから開き直してください。')); return; }
      // サーバーにある番号の静的レポートは、サーバーのほうを出す（編集・削除はサーバーのもの）
      var ids = {}; o.items.forEach(function (r) { ids[r.id] = 1; });
      items = base.filter(function (b) { return !b.sid || !ids[b.sid]; });
      o.items.forEach(function (r) { items.push({ id: r.id, mine: r.mine, href: 'view/?id=' + encodeURIComponent(r.id), title: r.title, by: r.by, ai: r.ai, lock: r.lock, day: ymdhm(r.at), t: r.at, i: -1 }); });
      newest();
      draw();
    }); }
    load(true);
    // ログインしている関係者には、🔒のレポートと「書く」ボタンも出す
    userP.then(function (u) {
      if (!u) return;
      // ログインしている人には「作成」ボタンを出す（書けるかどうかは作成ページとサーバーが確かめる）
      var w0 = $('#rpt-write'); if (w0) w0.hidden = false;
      call('me').then(function (o) { if (o.member) { var w = $('#rpt-write'); if (w) w.hidden = false; load(false); } });
    });
  }

  /* ---------- 1件を見る ---------- */
  function view() {
    var id = new URLSearchParams(location.search).get('id') || '', box = $('#rpt-box');
    // まずログインなしで読む。🔒のもの・自分のもの（直す・消す）は、ログインがわかってから読み直す
    function show(o) {
      if (!o.item) { box.replaceChildren(el('p', 'gate-msg', o.error === 'none' ? 'このレポートは見つかりませんでした（消されたか、関係者だけのものです）。' : err(o.error))); return; }
      var r = o.item; document.title = r.title + ' | レポート | HIYOKO X';
      $('#rpt-title').textContent = (r.lock ? '🔒 ' : '') + r.title;
      var meta = $('#rpt-meta'); meta.replaceChildren(who(r.by, r.ai), el('span', 'rpt-day', ymdhm(r.at) + (r.up && r.up !== r.at ? '（更新 ' + ymdhm(r.up) + '）' : '')));
      $('#rpt-body').innerHTML = render(r.body);
      // ページ内のリンク：折りたたみを開いて、その見出しへ移動
      $('#rpt-body').onclick = function (e) {
        var a = e.target.closest && e.target.closest('a.rpt-jump'); if (!a) return;
        var tg = document.getElementById(a.getAttribute('href').slice(1)); if (!tg) return;
        e.preventDefault();
        for (var d = tg; d; d = d.parentElement) if (d.tagName === 'DETAILS') d.open = true;
        tg.scrollIntoView({ behavior: 'smooth', block: 'start' });
        tg.classList.add('rpt-hit'); setTimeout(function () { tg.classList.remove('rpt-hit'); }, 1600);
      };
      if (r.mine) {
        var tools = $('#rpt-tools'); tools.hidden = false;
        $('#rpt-edit').href = '../new/?id=' + encodeURIComponent(r.id);
        $('#rpt-del').onclick = function () {
          if (!window.confirm('このレポートを消しますか？（元にもどせません）')) return;
          call('rdel', { id: r.id }).then(function (x) { if (x.ok) location.href = '../'; else window.alert(err(x.error)); });
        };
      }
    }
    var first = call('report', { id: id }, true);
    userP.then(function (u) {
      first.then(function (o) { if (!u) return show(o); if (o.item) show(o); return call('report', { id: id }).then(show); });
    });
    first.then(function (o) { if (o.item) show(o); });
  }

  /* ---------- 書く・直す ---------- */
  function edit() {
    var id = new URLSearchParams(location.search).get('id') || '', gate = $('#gate'), form = $('#rpt-form'), note = $('#rpt-note');
    function say(t) { gate.textContent = t; gate.hidden = false; form.hidden = true; }
    say('確認しています…');
    call('me').then(function (me) {
      if (!me.member) { say(me.login ? '関係者として登録した人だけが書けます。' : 'Googleでログインしてください（関係者だけが書けます）。'); return; }
      $('#rpt-as').textContent = me.name;
      if (!id) { gate.hidden = true; form.hidden = false; return; }
      $('#rpt-h').textContent = 'レポートを直す';
      return call('report', { id: id }).then(function (o) {
        if (!o.item || !o.item.mine) { say(o.item ? '自分が書いたレポートだけ直せます。' : err(o.error)); return; }
        form.title.value = o.item.title; form.body.value = o.item.body; form.lock.checked = o.item.lock;
        gate.hidden = true; form.hidden = false;
      });
    });
    function prev() { $('#rpt-prev').innerHTML = render(form.body.value) || '<p class="note">（本文がここに表示されます）</p>'; }
    form.body.addEventListener('input', prev); prev();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; note.textContent = '登録しています…';
      call('rput', { id: id || undefined, title: form.title.value, body: form.body.value, lock: form.lock.checked }).then(function (o) {
        btn.disabled = false;
        if (o.item) location.href = '../view/?id=' + encodeURIComponent(o.item.id);
        else note.textContent = '登録できませんでした：' + err(o.error);
      });
    });
  }

  /* ---------- 会員登録 ---------- */
  function join() {
    var code = decodeURIComponent((location.hash || '').slice(1)).trim(), form = $('#join-form'), note = $('#join-note'), st = $('#join-state');
    if (code) { form.code.value = code; [].forEach.call(document.querySelectorAll('[data-code]'), function (n) { n.textContent = code; }); }
    function state() {
      return userP.then(function (u) {
        if (!u) {
          st.replaceChildren(el('span', '', '① まずGoogleでログインします'));
          var b = el('button', 'gate-btn', 'Googleでログイン'); b.type = 'button';
          b.onclick = function () { window.triLogin && window.triLogin('google'); };
          st.appendChild(b); form.hidden = true; return;
        }
        st.replaceChildren(el('span', '', '✓ ' + (u.email || '') + ' でログイン中')); form.hidden = false;
        return call('me').then(function (me) {
          if (!form.name.value) form.name.value = me.name || u.name || '';
          if (me.member) { st.appendChild(el('b', 'join-ok', '（登録ずみ：' + me.name + '）')); $('#join-go').hidden = false; }
        });
      });
    }
    document.addEventListener('tri-user', function () { userP = Promise.resolve(window.TRI_USER); state(); });
    state();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; note.textContent = '登録しています…';
      call('join', { code: form.code.value, name: form.name.value }).then(function (o) {
        btn.disabled = false;
        if (!o.ok) { note.textContent = '登録できませんでした：' + err(o.error); return; }
        note.textContent = '登録しました。「' + o.name + '」の名前でレポートを書けます。';
        try { sessionStorage.removeItem('hyMember'); } catch (x) {}
        document.documentElement.classList.add('is-member'); $('#join-go').hidden = false;
      });
    });
  }

  ({ list: list, view: view, edit: edit, join: join })[mode]();
})();
