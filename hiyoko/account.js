/* HIYOKO：右上の「ログイン」（とわなにかの統合ログイン /triathlon/login/auth.js）。
   ログインは「だれか」を知るためだけ。社内資料を見られるかはサーバーが決める（internal/doc.js）。 */
(function () {
  'use strict';
  var brand = document.querySelector('.sitenav .brand');
  var base = brand ? brand.getAttribute('href') : './';
  if (base === './') base = '';
  var bar = document.querySelector('.hy-set');
  if (!bar) { bar = document.createElement('div'); bar.className = 'hy-set'; var m = document.querySelector('main') || document.body; m.insertBefore(bar, m.firstChild); }
  var box = document.createElement('div'); box.className = 'hy-acct';
  bar.insertBefore(box, bar.firstChild);
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function link(href, text) { var a = el('a', 'hy-acct-a', text); a.href = base + href; return a; }
  function show(u) {
    box.replaceChildren();
    if (u === undefined) return;
    if (!u) {
      var b = el('button', 'hy-acct-btn', 'ログイン'); b.type = 'button';
      b.addEventListener('click', function () {
        if (!window.triLogin) return;
        b.disabled = true;
        window.triLogin('google').catch(function () {}).then(function () { b.disabled = false; });
      });
      box.appendChild(b); return;
    }
    var dt = el('details', 'hy-acct-d'), su = el('summary'), ic = el('span', 'hy-acct-ic', (u.name || u.email || '?').trim().charAt(0).toUpperCase());
    su.appendChild(ic); su.appendChild(el('span', 'hy-acct-n', u.name || u.email || '')); dt.appendChild(su);
    var p = el('div', 'hy-set-p');
    p.appendChild(el('div', 'hy-acct-e', u.email || ''));
    var mem = el('div', 'mem-only');
    mem.appendChild(el('div', 'hy-set-h', '社内資料（関係者のみ）'));
    mem.appendChild(link('internal/strategy/', '企画・目標・方向性'));
    mem.appendChild(link('internal/review/', '振り返り'));
    mem.appendChild(link('internal/admin/', '管理'));
    p.appendChild(mem);
    var out = el('button', 'hy-acct-btn ghost', 'ログアウト'); out.type = 'button';
    out.addEventListener('click', function () { window.triLogout && window.triLogout(); });
    p.appendChild(out); dt.appendChild(p); box.appendChild(dt);
  }
  // メニューの外を押す・Esc で閉じる。片方を開いたら、もう片方（設定）は閉じる（1回だけ登録）
  function menus() { return [].slice.call(document.querySelectorAll('.hy-set details')); }
  document.addEventListener('click', function (e) { menus().forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menus().forEach(function (d) { d.open = false; }); });
  document.addEventListener('toggle', function (e) { var t = e.target; if (t.open && t.closest && t.closest('.hy-set')) menus().forEach(function (d) { if (d !== t) d.open = false; }); }, true);
  // 関係者かどうかはサーバー（hibiki-sync）が決める。関係者なら <html class="is-member"> にして、社内資料への入口（.mem-only）を出す。
  // 一般の人には入口そのものを出さない（中身はもともとサーバーが本人を確かめてから返す）。
  var API = 'https://hibiki-sync.jaykim-can.workers.dev/hiyoko/', KEY = 'hyMember', asked = null;
  function setMem(v) { document.documentElement.classList.toggle('is-member', !!v); }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function member(u) {
    if (u === undefined) return;
    if (!u) { setMem(false); ss(KEY, null); asked = null; return; }
    if (ss(KEY) === u.email) { setMem(true); return; }
    if (asked === u.email || !window.triToken) return;
    asked = u.email;
    window.triToken().then(function (tk) {
      return fetch(API + 'doc', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk }, body: JSON.stringify({ id: 'strategy' }) });
    }).then(function (r) { return r.json(); }).then(function (o) {
      var ok = !o.error || o.error === 'none';
      setMem(ok); if (ok) ss(KEY, u.email);
    }).catch(function () { asked = null; });
  }
  if (ss(KEY)) setMem(true);
  document.addEventListener('tri-user', function (e) { show(e.detail); member(e.detail); });
  import('/triathlon/login/auth.js?v=0.28').then(function () { if (window.TRI_USER !== undefined) { show(window.TRI_USER); member(window.TRI_USER); } })
    .catch(function () { box.replaceChildren(); });
  var st = document.createElement('style');
  st.textContent = '.hy-set{gap:8px;align-items:center}.hy-acct{position:relative}' +
    '.hy-acct-btn{display:inline-flex;align-items:center;min-height:36px;padding:4px 14px;border:1px solid var(--ink);border-radius:99px;background:var(--ink);color:var(--paper);font:inherit;font-size:.82rem;font-weight:700;cursor:pointer}' +
    '.hy-acct-btn.ghost{background:transparent;color:var(--ink);width:100%;justify-content:center;margin-top:10px}.hy-acct-btn:disabled{opacity:.5}' +
    '.hy-acct-d>summary{list-style:none;display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:3px 12px 3px 3px;border:1px solid var(--line);border-radius:99px;background:var(--card);font-size:.82rem;font-weight:700;cursor:pointer;max-width:200px}' +
    '.hy-acct-d>summary::-webkit-details-marker{display:none}.hy-acct-d[open]>summary{border-color:var(--ink)}' +
    '.hy-acct-ic{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--ink);color:var(--paper);font-size:.8rem;flex:none}' +
    '.hy-acct-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media (max-width:560px){.hy-acct-n{display:none}.hy-acct-d>summary{padding:3px}}' +
    '.hy-acct-e{font-size:.78rem;color:var(--muted);margin:0 0 10px;word-break:break-all}' +
    '.hy-acct-a{display:block;padding:7px 8px;border-radius:8px;color:var(--ink);text-decoration:none;font-size:.88rem}.hy-acct-a:hover{background:var(--paper)}';
  document.head.appendChild(st);
})();
