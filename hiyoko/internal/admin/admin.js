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

  // ── アクセス数（日別の棒グラフ＋ページ別ランキング）
  var RANGE = 30;
  function names() {
    var m = { '/hiyoko/internal/admin/': '社内資料の管理' };
    document.querySelectorAll('.sitenav a[href]').forEach(function (a) {
      try { var p = new URL(a.getAttribute('href'), location.href).pathname; if (!m[p]) m[p] = a.textContent.trim(); } catch (e) {}
    });
    m['/hiyoko/'] = 'ホーム';
    return m;
  }
  function dayList(from, to) {
    var out = [], d = new Date(from + 'T00:00:00Z'), end = new Date(to + 'T00:00:00Z');
    while (d <= end) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
    return out;
  }
  function fmt(n) { return n.toLocaleString('ja-JP'); }
  function drawChart(days, totals) {
    var box = document.getElementById('st-chart'), W = 720, H = 220, L = 40, R = 8, T = 14, B = 26;
    var max = Math.max(1, Math.max.apply(null, totals)), step = Math.pow(10, Math.floor(Math.log10(max)));
    var top = Math.ceil(max / step) * step; if (top / step > 5) step *= 2;
    var bw = (W - L - R) / days.length, gap = Math.min(2, bw * 0.2), y = function (v) { return T + (H - T - B) * (1 - v / top); };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="日別の閲覧数の棒グラフ">';
    for (var g = 0; g <= top; g += step) svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(g) + '" y2="' + y(g) + '" class="st-grid"/><text x="' + (L - 6) + '" y="' + (y(g) + 4) + '" class="st-ax" text-anchor="end">' + fmt(g) + '</text>';
    var every = Math.ceil(days.length / 8);
    days.forEach(function (d, i) {
      var v = totals[i], x = L + i * bw + gap / 2, w = Math.max(1, bw - gap), h = (H - T - B) - (y(v) - T), r = Math.min(4, w / 2, h);
      if (v > 0) svg += '<path class="st-b" d="M' + x + ',' + (H - B) + 'V' + (y(v) + r) + 'q0,-' + r + ' ' + r + ',-' + r + 'h' + (w - 2 * r) + 'q' + r + ',0 ' + r + ',' + r + 'V' + (H - B) + 'z"/>';
      svg += '<rect class="st-hit" x="' + (L + i * bw) + '" y="' + T + '" width="' + bw + '" height="' + (H - T - B) + '" data-i="' + i + '"/>';
      if ((i % every === 0 && days.length - 1 - i >= every * 0.6) || i === days.length - 1) svg += '<text x="' + (L + i * bw + bw / 2) + '" y="' + (H - 8) + '" class="st-ax" text-anchor="middle">' + (+d.slice(5, 7)) + '/' + (+d.slice(8)) + '</text>';
    });
    svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '" class="st-base"/></svg><div class="st-tip" hidden></div>';
    box.innerHTML = svg;
    box.scrollLeft = box.scrollWidth; // 新しい日（右端）から見せる
    var tip = box.querySelector('.st-tip');
    function show(e) {
      var t = e.target.closest('.st-hit'); if (!t) { tip.hidden = true; return; }
      var i = +t.getAttribute('data-i'), d = days[i];
      tip.textContent = (+d.slice(5, 7)) + '月' + (+d.slice(8)) + '日　' + fmt(totals[i]) + '回';
      var bx = box.getBoundingClientRect(), tr = t.getBoundingClientRect();
      tip.hidden = false; tip.style.left = Math.min(bx.width - tip.offsetWidth, Math.max(0, tr.left - bx.left + tr.width / 2 - tip.offsetWidth / 2)) + 'px';
      box.querySelectorAll('.st-hit.on').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on');
    }
    box.addEventListener('pointermove', show); box.addEventListener('click', show);
    box.addEventListener('pointerleave', function () { tip.hidden = true; box.querySelectorAll('.st-hit.on').forEach(function (x) { x.classList.remove('on'); }); });
  }
  function loadStats() {
    call('stats', { days: RANGE }).then(function (o) {
      if (o.error) { document.getElementById('st-chart').textContent = '読み込めませんでした（' + err(o.error) + '）'; return; }
      var days = dayList(o.from, o.to), byPage = {}, totals = days.map(function (d) {
        var c = o.days[d] || {}, t = 0; for (var p in c) { t += c[p]; byPage[p] = (byPage[p] || 0) + c[p]; } return t;
      });
      var sum = totals.reduce(function (a, b) { return a + b; }, 0), nm = names();
      document.getElementById('st-total').textContent = fmt(sum);
      document.getElementById('st-today').textContent = fmt(totals[totals.length - 1]);
      document.getElementById('st-avg').textContent = (sum / days.length).toFixed(1);
      document.getElementById('st-pages').textContent = fmt(Object.keys(byPage).length);
      drawChart(days, totals);
      var rank = Object.keys(byPage).sort(function (a, b) { return byPage[b] - byPage[a]; }), tb = document.getElementById('st-rank');
      tb.replaceChildren();
      if (!rank.length) { var tr0 = document.createElement('tr'), td0 = document.createElement('td'); td0.colSpan = 4; td0.textContent = 'まだ記録がありません'; tr0.appendChild(td0); tb.appendChild(tr0); }
      rank.slice(0, 50).forEach(function (p, i) {
        var tr = document.createElement('tr');
        var a = document.createElement('a'); a.href = p; a.textContent = nm[p] || p;
        var c = [String(i + 1), a, fmt(byPage[p]), (100 * byPage[p] / sum).toFixed(1) + '%'];
        c.forEach(function (v, j) { var td = document.createElement('td'); if (j >= 2) td.className = 'num'; if (typeof v === 'string') td.textContent = v; else td.appendChild(v); tr.appendChild(td); });
        tb.appendChild(tr);
      });
    }).catch(function () { document.getElementById('st-chart').textContent = 'サーバーにつながりませんでした'; });
  }
  document.querySelectorAll('.st-range button').forEach(function (b) {
    b.addEventListener('click', function () {
      RANGE = +b.getAttribute('data-d');
      document.querySelectorAll('.st-range button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      loadStats();
    });
  });
  var nc = document.getElementById('nocount');
  try { nc.checked = localStorage.getItem('hiyoko-nocount') === '1'; } catch (e) {}
  nc.addEventListener('change', function () { try { if (nc.checked) localStorage.setItem('hiyoko-nocount', '1'); else localStorage.removeItem('hiyoko-nocount'); } catch (e) {} });

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
      done = true; gate.hidden = true; body.hidden = false; drawMembers(o.members); drawDocs(o.docs); loadStats();
    }).catch(function () { say('<p class="gate-msg">サーバーにつながりませんでした。少し待ってから開き直してください。</p>'); });
  }
  say('<p class="gate-msg">確認しています…</p>');
  document.addEventListener('tri-user', function (e) { on(e.detail); });
  import('/triathlon/login/auth.js?v=0.28').then(function () { if (window.TRI_USER !== undefined) on(window.TRI_USER); })
    .catch(function () { say('<p class="gate-msg">ログインの仕組みを読み込めませんでした。</p>'); });
})();
