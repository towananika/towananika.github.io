/* HIYOKO レポート掲示板・会員登録（2026-11-25）
   読む：だれでも。書く：関係者（招待コードで登録した人・AI）とオーナー。判定はサーバー（hibiki-sync の /hiyoko/*、
   towananika/hibiki の worker/hiyoko.js）。画面の出しわけは見た目だけ。
   ページごとに <main data-rpt="list|view|edit|join"> で動きを決める。 */
(function () {
  'use strict';
  var API = 'https://hibiki-sync.jaykim-can.workers.dev/hiyoko/';
  var main = document.querySelector('main[data-rpt]');
  if (!main && !document.querySelector('[data-feed]')) return;
  var mode = main ? main.getAttribute('data-rpt') : '';
  function $(s) { return document.querySelector(s); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(t) { var d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ymdhm(t) { var d = new Date(t); return ymd(t) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  var MSG = { forbidden: '権限がありません', none: '見つかりませんでした', code: '招待コードがちがいます', closed: 'いまは登録を受けつけていません（管理者に聞いてください）',
    title_long: 'タイトルは120字までです', sum_long: 'ひとことは80字までです', img_type: '画像は JPEG・PNG・WebP だけです', img_big: '画像が大きすぎます（小さくしてから貼ってください）', net: '通信できませんでした。電波のよい所でもう一度',
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
    // ![説明](https://…) は画像（https だけ）
    var t = String(s).replace(/!\[([^\]\n]*)\]\((https:\/\/[^\s)]+)\)/g, function (_, alt, u) { links.push(['\u0001' + alt, u]); return '\u0000' + (links.length - 1) + '\u0000'; });
    t = t.replace(/\[([^\]\n]+)\]\((#[A-Za-z0-9_-]{1,40}|https?:\/\/[^\s)]+)\)/g, function (_, txt, u) { links.push([txt, u]); return '\u0000' + (links.length - 1) + '\u0000'; });
    t = esc(t).replace(/https?:\/\/[^\s<>"'\u0000]+/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener nofollow">' + u + '</a>'; });
    t = t.replace(/\u0000(\d+)\u0000/g, function (_, i) { var l = links[+i]; if (l[0].charAt(0) === '\u0001') return '<img class="rpt-img" src="' + esc(l[1]) + '" alt="' + esc(l[0].slice(1)) + '" loading="lazy">'; if (l[1].charAt(0) === '#') return '<a class="rpt-jump" href="#rp-' + l[1].slice(1) + '">' + esc(l[0]) + '</a>'; return '<a href="' + esc(l[1]) + '" target="_blank" rel="noopener nofollow">' + esc(l[0]) + '</a>'; });
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

  // 投稿の種類（2026-11-27）。back は 1件ページ（x/report/view/）から見た一覧の場所
  var KIND = {
    report: { name: 'レポート', icon: '📝', who: 'だれでも読めます', back: '../',
      tpl: '## わかったこと\n- \n\n## 根拠（数字）\n| 項目 | 数字 |\n|---|---|\n|  |  |\n\n## 次にやること\n- ' },
    news: { name: 'ニュース', icon: '📣', who: 'だれでも読めます（ホームの「お知らせ」にも出ます）', back: '../../../news/',
      tpl: '## なにが変わった？\n- \n\n## いつから\n- ' },
    internal: { name: '社内資料', icon: '🔒', who: '会員だけが読めます（一般の人には出ません）', back: '../../../internal/strategy/',
      tpl: '## 目的\n\n## 決めたこと\n- \n\n## 次にやること\n- ' }
  };

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
    function load(anon) { return call('reports', { kind: 'report' }, anon).then(function (o) {
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
      call('me').then(function (o) { if (o.member) { var w = $('#rpt-write'); if (w) w.hidden = false; var mi = $('#rpt-mine'); if (mi) mi.hidden = false; load(false); } });
    });
  }

  /* ---------- 1件を見る ---------- */
  function view() {
    var id = new URLSearchParams(location.search).get('id') || '', box = $('#rpt-box');
    // まずログインなしで読む。🔒のもの・自分のもの（直す・消す）は、ログインがわかってから読み直す
    function show(o) {
      if (!o.item) { box.replaceChildren(el('p', 'gate-msg', o.error === 'none' ? 'このレポートは見つかりませんでした（消されたか、関係者だけのものです）。' : err(o.error))); return; }
      var r = o.item, K = KIND[r.kind] || KIND.report; document.title = r.title + ' | ' + K.name + ' | HIYOKO';
      var back = $('#rpt-back'); if (back) { back.href = K.back; back.textContent = '← ' + K.name + 'の一覧'; }
      var pb = $('#rpt-pend'); if (pb) pb.hidden = !(r.mine && (r.pend || r.draft));
      if (pb && !pb.hidden) pb.querySelector('span').textContent = r.draft ? 'これは下書きです。あなたにだけ見えています。' : '公開前の直しかけがあります。いま見えているのは公開中の内容です。';
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
        // 移動先の見出しと、次の見出しまでの中身を約3秒光らせる
        var lv = /^H(\d)$/.test(tg.tagName) ? +tg.tagName.charAt(1) : 9, els = [tg];
        for (var n = tg.nextElementSibling; n; n = n.nextElementSibling) { var mh = n.tagName.match(/^H(\d)$/); if (mh && +mh[1] <= lv) break; els.push(n); }
        els.forEach(function (x) { x.classList.remove('rpt-hit'); void x.offsetWidth; x.classList.add('rpt-hit'); });
        setTimeout(function () { els.forEach(function (x) { x.classList.remove('rpt-hit'); }); }, 3100);
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

  /* ---------- 書く・直す（2026-11-27：種類カード・ひな形・自動保存・見た目・画像） ---------- */
  function edit() {
    var q = new URLSearchParams(location.search), id = q.get('id') || '', kind = KIND[q.get('kind')] ? q.get('kind') : '';
    var gate = $('#gate'), pick = $('#pe-pick'), form = $('#rpt-form'), st = $('#pe-state'), live = false, dirty = false, timer = 0, saving = null;
    var LS = 'hy-post-draft:' + (id || 'new');
    function say(t) { gate.textContent = t; gate.hidden = false; form.hidden = true; pick.hidden = true; }
    function lsGet() { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } }
    function lsSet(v) { try { if (v) localStorage.setItem(LS, JSON.stringify(v)); else localStorage.removeItem(LS); } catch (e) {} }
    function fields() { return { title: form.title.value, sum: form.sum.value, body: form.body.value, kind: kind, lock: kind === 'internal' || form.lock.checked }; }
    function setKind(k) {
      kind = k; var K = KIND[k];
      [].forEach.call(document.querySelectorAll('[data-k]'), function (n) { n.setAttribute('aria-pressed', n.getAttribute('data-k') === k ? 'true' : 'false'); });
      $('#pe-kind').textContent = K.icon + ' ' + K.name; $('#pe-kind-note').textContent = K.who;
      $('#rpt-h').textContent = (id ? '直す：' : '書く：') + K.name;
      $('#pe-lockrow').hidden = k !== 'report';
      $('#pe-publish').textContent = live ? '公開中の内容を更新する' : (k === 'internal' ? '会員だけに公開する' : '公開する');
    }
    // 欄ごとのまちがい（その欄のすぐ下に）
    function fieldErr(name, msg) { var n = $('#pe-err-' + name); if (n) { n.textContent = msg || ''; n.hidden = !msg; } }
    function check(pub) {
      var f = fields(), ok = true;
      fieldErr('title', f.title.length > 120 ? 'タイトルは120字までです（いま' + f.title.length + '字）' : pub && !f.title.trim() ? 'タイトルを入れてください' : '');
      fieldErr('sum', f.sum.length > 80 ? 'ひとことは80字までです（いま' + f.sum.length + '字）' : '');
      fieldErr('body', f.body.length > 60000 ? '本文が長すぎます（6万字まで）' : pub && !f.body.trim() ? '本文を入れてください' : '');
      [].forEach.call(document.querySelectorAll('.pe-err'), function (n) { if (!n.hidden) ok = false; });
      $('#pe-sum-n').textContent = f.sum.length + ' / 80';
      return ok;
    }
    function status(t, cls) { st.textContent = t; st.className = 'pe-state' + (cls ? ' pe-' + cls : ''); }
    function hm(t) { var d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
    // 自動保存：打つのが止まって2秒後に、下書きとしてサーバーへ。電波がなくてもこの端末には残す
    function save() {
      if (!dirty || saving) return saving || Promise.resolve();
      if (!check(false)) { status('まちがいを直すと保存します', 'warn'); return Promise.resolve(); }
      dirty = false; status('保存しています…');
      var f = fields(); f.draft = true; if (id) f.id = id;
      saving = call('rput', f).then(function (o) {
        saving = null;
        if (o.item) {
          if (!id) { id = o.item.id; lsSet(null); LS = 'hy-post-draft:' + id; history.replaceState(null, '', '?id=' + encodeURIComponent(id)); }
          lsSet(null); status('✓ 下書きを保存しました（' + hm(Date.now()) + '）', 'ok');
        } else { dirty = true; status('保存できませんでした：' + err(o.error) + '。この端末には残っています', 'warn'); }
      });
      return saving;
    }
    function touched() {
      dirty = true; check(false); lsSet(fields()); status('入力中…');
      clearTimeout(timer); timer = setTimeout(save, 2000);
    }
    window.addEventListener('beforeunload', function (e) { if (dirty) { save(); e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });

    function fill(src) { form.title.value = src.title || ''; form.sum.value = src.sum || ''; form.body.value = src.body || ''; form.lock.checked = !!src.lock; check(false); }
    function start() {
      gate.hidden = true; pick.hidden = true; form.hidden = false; setKind(kind);
      var b = lsGet(); if (b && (b.title || b.body) && b.body !== form.body.value) {
        var r = $('#pe-restore'); r.hidden = false;
        r.querySelector('button').onclick = function () { fill(b); dirty = true; save(); r.hidden = true; };
      }
      prev();
    }
    say('確認しています…');
    call('me').then(function (me) {
      if (!me.member) { say(me.login ? '関係者として登録した人だけが書けます。' : 'Googleでログインしてください（関係者だけが書けます）。'); return; }
      $('#rpt-as').textContent = me.name + (me.ai ? '（AI）' : '');
      if (!id) {
        if (kind) { fill({ body: KIND[kind].tpl }); start(); return; }
        gate.hidden = true; pick.hidden = false; return;
      }
      return call('report', { id: id }).then(function (o) {
        if (!o.item || !o.item.mine) { say(o.item ? '自分が書いた投稿だけ直せます。' : err(o.error)); return; }
        live = !o.item.draft; kind = o.item.kind || 'report';
        fill(o.item.pending || o.item);
        if (o.item.pending) status('公開前の直しかけを開きました', 'ok');
        if (live) $('#pe-live').hidden = false;
        start();
      });
    });
    // 種類カード
    [].forEach.call(document.querySelectorAll('#pe-pick [data-k]'), function (b) {
      b.onclick = function () { kind = b.getAttribute('data-k'); fill({ body: KIND[kind].tpl }); start(); form.title.focus(); };
    });
    $('#pe-kind-change').onclick = function () { if (live) return; form.hidden = true; pick.hidden = false; };
    // 書く｜見た目（見た目はスマホ幅でも見られる）
    function prev() {
      var f = fields();
      $('#rpt-prev').innerHTML = '<h2 class="pe-prev-t">' + esc(f.title || '（タイトル）') + '</h2>' + (f.sum ? '<p class="pe-prev-s">' + esc(f.sum) + '</p>' : '') + (render(f.body) || '<p class="note">（本文がここに表示されます）</p>');
    }
    [].forEach.call(document.querySelectorAll('[data-pe-tab]'), function (t) {
      t.onclick = function () {
        var v = t.getAttribute('data-pe-tab');
        [].forEach.call(document.querySelectorAll('[data-pe-tab]'), function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
        $('#pe-write').hidden = v !== 'write'; $('#pe-look').hidden = v === 'write';
        $('#rpt-prev').classList.toggle('pe-phone', v === 'phone'); if (v !== 'write') prev();
      };
    });
    ['title', 'sum', 'body'].forEach(function (n) { form[n].addEventListener('input', touched); });
    form.lock.addEventListener('change', touched);
    // 画像：ボタン・貼りつけ・ドラッグ。1200px・約110KBまで小さくしてから送る
    function shrink(file) {
      return new Promise(function (res, rej) {
        var img = new Image(), u = URL.createObjectURL(file);
        img.onload = function () {
          var k = Math.min(1, 1200 / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
          var qv = 0.85, d;
          do { d = c.toDataURL('image/webp', qv); if (d.indexOf('data:image/webp') !== 0) d = c.toDataURL('image/jpeg', qv); qv -= 0.12; } while (d.length * 0.75 > 110 * 1024 && qv > 0.2);
          if (d.length * 0.75 > 110 * 1024) { c.width = Math.round(c.width * 0.6); c.height = Math.round(c.height * 0.6); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); d = c.toDataURL('image/jpeg', 0.6); }
          res(d);
        };
        img.onerror = function () { URL.revokeObjectURL(u); rej('img_type'); };
        img.src = u;
      });
    }
    function insert(text) {
      var ta = form.body, a = ta.selectionStart || ta.value.length, b = ta.selectionEnd || a;
      ta.value = ta.value.slice(0, a) + text + ta.value.slice(b); ta.selectionStart = ta.selectionEnd = a + text.length; touched();
    }
    function addImage(file) {
      if (!file || !/^image\//.test(file.type)) return;
      fieldErr('body', ''); status('画像を送っています…');
      shrink(file).then(function (d) { return call('img', { data: d }); }).then(function (o) {
        if (!o.id) { fieldErr('body', '画像を入れられませんでした：' + err(o.error)); status(''); return; }
        insert('\n![画像の説明](' + API + 'img/' + o.id + ')\n'); status('画像を入れました。「画像の説明」を書きかえてください', 'ok');
      }, function (e) { fieldErr('body', err(e)); });
    }
    $('#pe-img').onchange = function () { [].forEach.call(this.files, addImage); this.value = ''; };
    form.body.addEventListener('paste', function (e) { var it = e.clipboardData && e.clipboardData.files; if (it && it.length) { e.preventDefault(); [].forEach.call(it, addImage); } });
    form.body.addEventListener('drop', function (e) { var it = e.dataTransfer && e.dataTransfer.files; if (it && it.length) { e.preventDefault(); [].forEach.call(it, addImage); } });
    // 公開
    form.addEventListener('submit', function (e) {
      e.preventDefault(); clearTimeout(timer);
      if (!check(true)) { status('赤い所を直してください', 'warn'); return; }
      var btn = $('#pe-publish'); btn.disabled = true; status('公開しています…');
      (saving || Promise.resolve()).then(function () {
        var f = fields(); if (id) f.id = id;
        return call('rput', f);
      }).then(function (o) {
        btn.disabled = false;
        if (o.item) { dirty = false; lsSet(null); location.href = '../view/?id=' + encodeURIComponent(o.item.id); }
        else { status('公開できませんでした：' + err(o.error), 'warn'); if (o.error === 'title_long' || o.error === 'empty') check(true); }
      });
    });
  }

  /* ---------- 自分の投稿（下書き・公開中・直しかけ） ---------- */
  function mine() {
    var box = $('#pm-list'), filt = 'all', items = [];
    function draw() {
      box.replaceChildren();
      var list = items.filter(function (r) { return filt === 'all' || (filt === 'draft' ? (r.draft || r.pend) : filt === 'ai' ? r.ai : r.kind === filt); });
      if (!list.length) { box.appendChild(el('div', 'rpt-empty', items.length ? 'この条件の投稿はありません' : 'まだ投稿はありません。「書く」から始めましょう')); return; }
      list.forEach(function (r) {
        var K = KIND[r.kind] || KIND.report, row = el('div', 'rpt-row-wrap'), a = el('a', 'rpt-row');
        a.href = (r.draft ? '../new/?id=' : '../view/?id=') + encodeURIComponent(r.id);
        var t = el('span', 'rpt-row-title'); t.appendChild(el('span', 'pm-kind pm-' + r.kind, K.icon + ' ' + K.name)); t.appendChild(document.createTextNode(' ' + r.title));
        a.appendChild(t);
        var meta = el('span', 'rpt-row-meta');
        if (r.draft) meta.appendChild(el('span', 'pm-st draft', '下書き')); else if (r.pend) meta.appendChild(el('span', 'pm-st pend', '直しかけあり')); else meta.appendChild(el('span', 'pm-st live', '公開中'));
        meta.appendChild(who(r.by, r.ai)); meta.appendChild(el('span', 'rpt-day', ymdhm(r.up || r.at)));
        a.appendChild(meta); row.appendChild(a);
        var tl = el('span', 'rpt-row-tools'), ed = el('a', 'btn btn-sm btn-ghost', '直す'), dl = el('button', 'btn btn-sm btn-danger', '消す');
        ed.href = '../new/?id=' + encodeURIComponent(r.id); dl.type = 'button';
        dl.onclick = function () {
          if (!window.confirm('「' + r.title + '」を消しますか？（元にもどせません）')) return;
          dl.disabled = true;
          call('rdel', { id: r.id }).then(function (x) { if (x.ok) { items = items.filter(function (y) { return y !== r; }); draw(); } else { dl.disabled = false; window.alert(err(x.error)); } });
        };
        tl.appendChild(ed); tl.appendChild(dl); row.appendChild(tl); box.appendChild(row);
      });
    }
    [].forEach.call(document.querySelectorAll('[data-pm]'), function (b) {
      b.onclick = function () { filt = b.getAttribute('data-pm'); [].forEach.call(document.querySelectorAll('[data-pm]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); draw(); };
    });
    box.replaceChildren(el('div', 'rpt-empty', '読み込んでいます…'));
    call('me').then(function (me) {
      if (!me.member) { box.replaceChildren(el('div', 'rpt-empty', me.login ? '関係者として登録した人だけが使えます。' : 'Googleでログインしてください。')); return; }
      call('mine').then(function (o) {
        if (!o.items) { box.replaceChildren(el('div', 'rpt-empty', err(o.error))); return; }
        items = o.items.sort(function (a, b) { return (b.up || b.at) - (a.up || a.at); }); draw();
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

  /* ---------- ほかのページに出す一覧（<div data-feed="news|internal" data-limit="3" data-base="x/report/">） ---------- */
  function feeds() {
    [].forEach.call(document.querySelectorAll('[data-feed]'), function (box) {
      var k = box.getAttribute('data-feed'), lim = +box.getAttribute('data-limit') || 50, base = box.getAttribute('data-base') || '', anon = k !== 'internal';
      function draw(o) {
        if (!o.items) return;
        var list = o.items.slice(0, lim); box.replaceChildren();
        box.hidden = !list.length && box.hasAttribute('data-hide-empty');
        if (!list.length) { box.appendChild(el('div', 'rpt-empty', 'まだありません')); return; }
        list.forEach(function (r) {
          var a = el('a', 'feed-row'); a.href = base + 'view/?id=' + encodeURIComponent(r.id);
          a.appendChild(el('span', 'feed-d', ymd(r.at)));
          var t = el('span', 'feed-t'); t.appendChild(el('strong', '', r.title)); if (r.sum) t.appendChild(el('em', '', r.sum)); a.appendChild(t);
          box.appendChild(a);
        });
      }
      call('reports', { kind: k }, anon).then(draw);
      userP.then(function (u) { if (!u) return; call('me').then(function (me) {
        if (!me.member) return;
        [].forEach.call(document.querySelectorAll('[data-write]'), function (w) { w.hidden = false; });
        if (anon) call('reports', { kind: k }).then(draw);
      }); });
    });
  }

  if (mode) ({ list: list, view: view, edit: edit, join: join, mine: mine })[mode]();
  feeds();
})();
