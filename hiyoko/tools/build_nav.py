#!/usr/bin/env python3
"""Rebuild the HIYOKO site nav (all pages) and the home-page sitemap.
Usage: python3 build_nav.py /path/to/towananika.github.io/hiyoko
Portal pages (home, links, about, character, vision) come from gen_portal.py; analysis/ holds the SNS analysis hub + sitemap.
Internal pages load their content from hibiki-sync behind the site login; see internal/doc.js."""
import os, re, sys
ROOT = sys.argv[1]
# (heading, css class, [(label, href rel. to hiyoko/, desc, locked)])
# Top tabs = sections (global nav). Left nav = pages of the current section only.
# 2026-11-27: 4 public tabs (SNS分析 2nd = most used) + members-only tab; ニュース lives in the footer + home
SECTIONS = [("home", "ホーム", ""), ("analysis", "SNS分析", "analysis/"), ("know", "HIYOKOを知る", "about/"),
            ("links", "公式リンク", "links/"), ("in", "🔒 社内資料", "internal/strategy/")]
def section_of(p):
    if p == "": return "home"
    if p == "links/": return "links"
    if p == "news/": return "home"
    if p in ("about/", "world/", "character/"): return "know"
    if p.startswith("internal/"): return "in"
    if p == "join/": return "join"
    return "analysis"
GROUP_SECTION = {"h": "know", "m": "analysis", "x": "analysis", "ig": "analysis", "old": "analysis", "in": "in"}
GROUPS = [
  ("HIYOKOを知る", "h", [("HIYOKOを知る", "about/", "しくみ・目的・キャラクター", False)]),
  # 2026-11-27: SNS分析 = 4 tabs (shown as a tab row at the top of every SNS分析 page; no left nav)
  ("SNS分析", "m", [("分析トップ", "analysis/", "XとInstagramの流れと、強い投稿", False),
                 ("月ごと", "x/monthly/", "1年の流れと、月ごとの理由", False),
                 ("投稿一覧", "kpi/", "全投稿の数字を並べ替え", False),
                 ("レポート", "x/report/", "調査と分析のレポート", False)]),
  ("社内資料（関係者のみ）", "in", [("企画・目標・方向性", "internal/strategy/", "ログインして開く", True),
                          ("振り返り", "internal/review/", "ログインして開く", True)]),
]
# footer sitemap: short, unambiguous labels (the footer has no X / Instagram sub-headings)
FOOT = {"links": [("公式リンク集", "links/"), ("開発ニュース", "news/")]}
PAGES = ["", "links/", "about/", "news/", "analysis/", "kpi/", "x/monthly/", "x/plan/", "internal/strategy/", "internal/review/", "internal/admin/"]
# pages that fill their own "このページの目次" (report.js / join page): only tabs, left nav and footer are rebuilt
KEEP_TOC = ["x/report/", "x/report/new/", "x/report/view/", "join/"] + [f"x/report/{n}/" for n in range(1, 100) if os.path.exists(os.path.join(ROOT, f"x/report/{n}/index.html"))]
REDIRECTS = {"x/": "analysis/#x-overview", "ig/": "analysis/#ig-overview", "x/content/": "analysis/#x-content",
             "ig/content/": "analysis/#ig-content", "2026-11/": "analysis/#x-content", "a-ranking/": "analysis/#x-content",
             "x/posts/": "kpi/", "ig/posts/": "kpi/#ig"}
for _p, _to in REDIRECTS.items():
    _pre = "../" * _p.count("/")
    os.makedirs(os.path.join(ROOT, _p), exist_ok=True)
    open(os.path.join(ROOT, _p, "index.html"), "w", encoding="utf-8").write(
        f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
        f'<meta http-equiv="refresh" content="0; url={_pre}{_to}"><title>HIYOKO SNS分析</title></head>'
        f'<body><p><a href="{_pre}{_to}">SNS分析へ</a></p></body></html>\n')
exists = lambda h: os.path.exists(os.path.join(ROOT, h, "index.html"))

# sub-anchors per page, taken from each page's own nav (current page lists them as #id)
NAV_RE = re.compile(r'<details class="sitenav".*?</details>', re.S)
subs = {}
for p in PAGES:
    html = open(os.path.join(ROOT, p, "index.html"), encoding="utf-8").read()
    t = re.search(r'<details class="pagetoc".*?</details>', html, re.S)
    if t:
        subs[p] = re.findall(r'<li><a href="#([^"]+)">([^<]*)</a></li>', t.group(0)); continue
    nav = NAV_RE.search(html).group(0)
    m = re.search(r'aria-current="page">[^<]*</a><ul>(.*?)</ul>', nav)
    if not m:  # home: subs absent; take from another page's nav
        continue
    subs[p] = re.findall(r'<li><a href="#([^"]+)">([^<]*)</a></li>', m.group(1))
for p in PAGES:  # pages whose subs we didn't capture: read from home nav
    if p in subs or p == "": continue
    if os.path.exists(os.path.join(ROOT, "x", "index.html")) and "<details class=\"toc\"" in open(os.path.join(ROOT, p, "index.html"), encoding="utf-8").read(): continue
    home = NAV_RE.search(open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()).group(0)
    m = re.search(r'href="%s">[^<]*</a><ul>(.*?)</ul>' % re.escape(p), home)
    subs[p] = re.findall(r'<li><a href="%s#([^"]+)">([^<]*)</a></li>' % re.escape(p), m.group(1)) if m else []

MEMBER = {"in"}  # sections shown only to logged-in members (html.is-member, set by account.js after the server says yes)
def mo(k): return ' mem-only' if k in MEMBER else ''

def nav_for(cur, toc=True):
    """Left: site map (pages only). Right: this page's sections (only pages with sections)."""
    pre = "../" * cur.count("/")
    sec = section_of(cur)
    groups = [g for g in GROUPS if GROUP_SECTION[g[1]] == sec]
    if not groups or sec == "analysis" or sum(len(g[2]) for g in groups) <= 1:  # one-page section / tabbed section: keep an empty, hidden nav so the layout knows there is none
        groups = []
        out = ['<details class="sitenav" hidden><summary>ページ一覧</summary><div></div></details>']
    else:
        out = ['<details class="sitenav" open><summary>このコーナーのページ</summary><div>',
               f'<a class="brand" href="{pre or "./"}">HIYOKO</a>']
    for head, cls, items in groups:
        out.append(f'<span class="ch {cls}{mo(GROUP_SECTION[cls])}">{"🔒 " if cls=="in" else ""}{head}</span><ul class="{mo(GROUP_SECTION[cls]).strip()}">')
        for label, href, _, locked in items:
            if locked and not exists(href):
                out.append(f'<li><span class="page off">{label}（準備中）</span></li>'); continue
            cur_a = ' aria-current="page"' if (href == cur or (href == "x/report/" and cur.startswith("x/report/"))) else ""
            out.append(f'<li><a class="page" href="{pre}{href}"{cur_a}>{label}</a></li>')
        out.append('</ul>')
    if groups: out.append('</div></details>')
    if toc and subs.get(cur):
        out.append('<details class="pagetoc" open><summary>このページの目次</summary><ul>')
        out.append("".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in subs[cur]))
        out.append('</ul></details>')
    return "".join(out)

def subtabs(cur, pre):
    items = next(g[2] for g in GROUPS if g[1] == "m")
    def on(h): return h == cur or (h == "x/report/" and cur.startswith("x/report/"))
    return ('<nav class="hy-sub" aria-label="SNS分析"><div>' + "".join(
        f'<a href="{pre}{h}"' + (' aria-current="page"' if on(h) else '') + f'>{l}</a>' for l, h, _, _ in items) + '</div></nav>\n')

def tabs(cur):
    pre = "../" * cur.count("/"); sec = section_of(cur)
    return tabs0(cur) + (subtabs(cur, pre) if sec == "analysis" else "")

def tabs0(cur):
    pre = "../" * cur.count("/"); sec = section_of(cur)
    return ('<nav class="hy-tabs" aria-label="コーナー"><div>' + "".join(
        f'<a href="{pre}{h}"' + (f' class="{mo(k).strip()}"' if mo(k) else "") + (' aria-current="true"' if k == sec else "") + f'>{l}</a>' for k, l, h in SECTIONS) + '</div></nav>\n')

def footmap(cur):
    pre = "../" * cur.count("/")
    cols = []
    for k, l, h in SECTIONS:
        if k == "home": continue
        items = FOOT.get(k) or [(it[0], it[1]) for g in GROUPS if GROUP_SECTION[g[1]] == k for it in g[2] if not (it[3] and not exists(it[1]))]
        links = "".join(f'<li><a href="{pre}{h2}">{l2}</a></li>' for l2, h2 in items[:6])
        cols.append(f'<div class="{mo(k).strip()}"><a class="fm-h" href="{pre}{h}">{l}</a>' + (f'<ul>{links}</ul>' if links else '') + '</div>')
    return '<!--fmap--><nav class="fmap" aria-label="サイトマップ">' + "".join(cols) + '</nav><!--/fmap-->\n'

def sitemap():
    out = ['<!--smap--><div class="smap-h">ページ一覧</div><div class="smap">']
    for head, cls, items in GROUPS:
        if cls == "h": continue
        items = [it for it in items if it[1] != "analysis/"]
        out.append(f'<div class="sm {cls}{mo(GROUP_SECTION[cls])}"><span class="sm-h">{"🔒 " if cls=="in" else ""}{head}</span>')
        for label, href, desc, locked in items:
            if locked and not exists(href):
                out.append(f'<span class="sm-i off"><strong>{label}</strong><em>準備中</em></span>'); continue
            out.append(f'<a class="sm-i" href="../{href}"><strong>{label}</strong><em>{desc}</em></a>')
        out.append('</div>')
    out.append('</div><!--/smap-->')
    return "".join(out)

for p in PAGES + KEEP_TOC:
    f = os.path.join(ROOT, p, "index.html")
    if not os.path.exists(f): continue
    keep = p in KEEP_TOC
    html = open(f, encoding="utf-8").read()
    if not keep: html = re.sub(r'<details class="pagetoc".*?</details>', '', html, flags=re.S)
    # top header: Towananika > HIYOKO, with the login / settings slot (filled by account.js and i18n.js)
    pre = "../" * p.count("/")
    html = re.sub(r'<a class="skip" href="#main">[^<]*</a>', '', html)
    html = re.sub(r'<header class="hy-top">.*?</header>\n?', '', html, flags=re.S)
    html = re.sub(r'<nav class="hy-tabs".*?</nav>\n?', '', html, flags=re.S)
    html = re.sub(r'<nav class="hy-sub".*?</nav>\n?', '', html, flags=re.S)
    html = re.sub(r'<!--fmap-->.*?<!--/fmap-->\n?', '', html, flags=re.S)
    html = re.sub(r'(<body[^>]*>\n?)', lambda m: m.group(1) + f'<a class="skip" href="#main">本文へスキップ</a><header class="hy-top"><nav class="hy-path" aria-label="サイト"><a href="/">Towananika</a><span aria-hidden="true">›</span><a href="{pre or "./"}">HIYOKO</a><span class="fan-badge">非公式ファンサイト</span></nav><div class="hy-set"></div></header>\n' + tabs(p), html, count=1)
    html = re.sub(r'<main(?![^>]*id=)', '<main id="main"', html, count=1)
    if p.startswith("internal/") and 'name="robots"' not in html:
        html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="robots" content="noindex,nofollow">', 1)
    # breadcrumbs start at Towananika
    html = re.sub(r'<nav class="crumbs">(?!<a href="/">Towananika)', '<nav class="crumbs"><a href="/">Towananika</a> ／ ', html, count=1)
    # fan-site disclaimer at the end of every page's main
    html = re.sub(r'<!--fan-->.*?<!--/fan-->\n?', '', html, flags=re.S)
    _fan = '<!--fan--><p class="fan-foot"><span>🐣 このサイトはファンが作った非公式サイトです。HIYOKO公式とは関係ありません。</span> <a href="https://hiyokotoken.com/" target="_blank" rel="noopener">正しい情報は公式サイトへ ↗</a></p><!--/fan-->\n'
    _m = re.search(r'<footer[^>]*>(?:(?!</main>).)*</main>', html, re.S)
    _fan = _fan + (footmap(p) if p else '')  # home already is the map
    html = html[:_m.start()] + _fan + html[_m.start():] if _m else html.replace('</main>', _fan + '</main>', 1)
    html = NAV_RE.sub(lambda _: nav_for(p, not keep), html, count=1)
    if 'account.js' not in html:
        pre = "../" * p.count("/")
        html = html.replace('</body>', f'<script src="{pre}account.js" defer></script>\n</body>', 1)
    if 'nav.js' not in html:
        pre = "../" * p.count("/")
        html = html.replace('</body>', f'<script src="{pre}nav.js" defer></script>\n</body>', 1)
    # old "analysis top" crumb -> HIYOKO / SNS分析
    def _cr(m):
        up = m.group(1)
        return f'<a href="{up}">HIYOKO</a>' + ('' if p.startswith("internal/") else f' ／ <a href="{up}analysis/">SNS分析</a>')
    html = re.sub(r'<a href="((?:\.\./)+)">HIYOKO分析トップ</a>', _cr, html)
    if p == "analysis/":
        html = re.sub(r'(<!--smap-->.*?<!--/smap-->|<div class="dash-c">.*?</div>\s*<div class="dash-l">.*?</div>)',
                      lambda _: sitemap(), html, count=1, flags=re.S)
    open(f, "w", encoding="utf-8").write(html)
print("ok", {k: len(v) for k, v in subs.items()})

# cache-bust shared assets: ?v=<content hash> so browsers never mix new HTML with old CSS/JS
import hashlib, glob as _g
_ver = {n: hashlib.sha1(open(os.path.join(ROOT, n), "rb").read()).hexdigest()[:8] for n in ("style.css", "i18n.js", "nav.js", "account.js")}
for f in _g.glob(os.path.join(ROOT, "**", "index.html"), recursive=True):
    h = open(f, encoding="utf-8").read()
    h2 = re.sub(r'((?:href|src)="(?:\.\./)*(style\.css|i18n\.js|nav\.js|account\.js))(?:\?v=\w+)?"', lambda m: f'{m.group(1)}?v={_ver[m.group(2)]}"', h)
    if h2 != h: open(f, "w", encoding="utf-8").write(h2)
print("assets", _ver)
