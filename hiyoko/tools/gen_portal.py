#!/usr/bin/env python3
"""Generate the HIYOKO portal pages (home, links, about, character, vision).
Header / left nav / page TOC are filled afterwards by build_nav.py."""
import json, os, re, sys
ROOT = sys.argv[1]  # .../hiyoko
CHECKED = "2026年11月20日"

SI_PATHS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "brand-icons.json"), encoding="utf-8"))["paths"]
SI_SLUG = {"x": "x", "ig": "instagram", "th": "threads", "tt": "tiktok", "yt": "youtube", "fb": "facebook", "tg": "telegram", "lt": "linktree", "no": "notion"}
def brand(cls):
    """Brand logo from Simple Icons (CC0), white on the brand colour."""
    if cls not in SI_SLUG: return None
    path = SI_PATHS[SI_SLUG[cls]]
    return f'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="{path}"/></svg>'

# character art: official Instagram posts, shown with Instagram's own embed (nothing copied into this repo)
def igpost(code):
    url = f"https://www.instagram.com/p/{code}/"
    return (f'<blockquote class="instagram-media ig-embed" data-instgrm-permalink="{url}?utm_source=ig_embed" data-instgrm-version="14">'
            f'<a href="{url}" target="_blank" rel="noopener">📸 Instagramで見る（@hiyoko_global）</a></blockquote>')
CREDIT = '<p class="credit">画像：<a href="https://www.instagram.com/hiyoko_global/" target="_blank" rel="noopener">公式Instagram @hiyoko_global</a> の投稿をInstagramの埋め込みで表示（© HIYOKO）</p>'
IG_JS = '<script async src="https://www.instagram.com/embed.js"></script>\n'

TR = {}
def t(ja, en, ko):
    TR[ja] = [en, ko]; return ja

def ext(href, inner, cls):
    return f'<a class="{cls}" href="{href}" target="_blank" rel="noopener">{inner}</a>'

def shell(path, title, desc, body, toc=None, bodycls="pt"):
    pre = "../" * path.count("/")
    tochtml = ""
    if toc:
        tochtml = '<details class="pagetoc" open><summary>このページの目次</summary><ul>' + "".join(
            f'<li><a href="#{i}">{t}</a></li>' for i, t in toc) + "</ul></details>\n"
    html = f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="{desc}">
<title>{title}</title>
<link rel="stylesheet" href="{pre}style.css">
</head>
<body class="{bodycls}">
<div class="layout">
<details class="sitenav" open></details>
{tochtml}<main id="main">
{body}
<footer>HIYOKO 非公式ファンサイト ／ 確認日 {CHECKED}</footer>
</main>
</div>
<script>
try{{if(window.matchMedia('(max-width:900px)').matches)document.querySelector('.sitenav').removeAttribute('open');}}catch(e){{}}
</script>
{IG_JS if "instagram-media" in body else ""}<script src="{pre}i18n.js" defer></script>
<script src="{pre}nav.js" defer></script>
<script src="{pre}account.js" defer></script>
</body>
</html>
"""
    d = os.path.join(ROOT, path)
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(html)

# ---------- official links (checked on hiyokotoken.com and linktr.ee/HIYOKO_global, 2026-11-20) ----------
SNS = [
    ("x", "𝕏", "X", "@HiyokoGlobal", "お知らせ・キャンペーン", "https://x.com/HiyokoGlobal"),
    ("ig", "📸", "Instagram", "@hiyoko_global", "キャラのリールと写真", "https://www.instagram.com/hiyoko_global/"),
    ("th", "@", "Threads", "@hiyoko_global", "Instagramとつながる短い投稿", "https://www.threads.com/@hiyoko_global"),
    ("tt", "♪", "TikTok", "@hiyoko_global", "ショート動画", "https://www.tiktok.com/@hiyoko_global"),
    ("yt", "▶", "YouTube", "@hiyokoglobal", "動画", "https://www.youtube.com/@hiyokoglobal"),
    ("fb", "f", "Facebook", "HIYOKO", "お知らせ", "https://www.facebook.com/profile.php?id=100090532489960"),
]
COMMUNITY = [("tg", "✈", "Telegram", "hiyoko_Official", "お知らせ・コミュニティのチャット", "https://t.me/hiyoko_Official")]
SITES = [
    ("hy", "🐣", "公式サイト", "hiyokotoken.com", "HYKとエコシステムの説明", "https://hiyokotoken.com/"),
    ("hy", "📄", "ホワイトペーパー", "hiyokotoken.com/whitepaper", "しくみとトークンの設計（PDFあり）", "https://hiyokotoken.com/whitepaper/"),
    ("lt", "🌳", "Linktree", "linktr.ee/HIYOKO_global", "公式のリンクまとめ", "https://linktr.ee/HIYOKO_global"),
]
TRADE = [("cs", "📈", "CoinStore", "HYK / USDT", "公式サイトが案内している取引所", "https://www.coinstore.com/spot/HYKUSDT")]
SERVICES = [
    ("hy", "🎟", "Season 1 Sale", "season.hiyoko.vip", "セール", "https://season.hiyoko.vip/"),
    ("hy", "🎁", "QR Airdrop", "qr.hiyoko.vip", "エアドロップ", "https://qr.hiyoko.vip/"),
    ("hy", "✅", "AfterSale Claim", "sale.hiyoko.io", "セール後の受け取り", "https://sale.hiyoko.io/"),
]
FUN = [
    ("no", "🖼", "HIYOKOの壁紙", "Notion", "スマホ・PCの壁紙", "https://fate-eclipse-336.notion.site/For-you-368fd665c10480669a43f3ce3f30efc1"),
    ("hy", "🎮", "Happy Chick", "xiaoji001.org", "ゲームのエミュレーター（無料）", "https://xiaoji001.org/"),
]

SRC_NAMES = {"site": "公式サイト", "lt": "公式Linktree", "ig": "公式Instagram"}
SRC = {
    "https://x.com/HiyokoGlobal": "site lt", "https://www.instagram.com/hiyoko_global/": "site lt",
    "https://www.threads.com/@hiyoko_global": "ig", "https://www.tiktok.com/@hiyoko_global": "site lt",
    "https://www.youtube.com/@hiyokoglobal": "site lt", "https://www.facebook.com/profile.php?id=100090532489960": "site lt",
    "https://t.me/hiyoko_Official": "site", "https://hiyokotoken.com/": "lt", "https://hiyokotoken.com/whitepaper/": "site",
    "https://linktr.ee/HIYOKO_global": "ig", "https://www.coinstore.com/spot/HYKUSDT": "site lt",
    "https://season.hiyoko.vip/": "site", "https://qr.hiyoko.vip/": "site", "https://sale.hiyoko.io/": "site",
    "https://fate-eclipse-336.notion.site/For-you-368fd665c10480669a43f3ce3f30efc1": "lt", "https://xiaoji001.org/": "lt",
}
def src_label(url):
    return "出典：" + "・".join(SRC_NAMES[k] for k in SRC[url].split())

def cards(items):
    out = ['<div class="lks">']
    for cls, ic, name, handle, what, url in items:
        inner = (f'<span class="lk-ic {cls}" aria-hidden="true">{brand(cls) or ic}</span>'
                 f'<span class="lk-t"><strong>{name}</strong><em>{handle}</em><small>{what}</small><span class="src">{src_label(url)}</span></span>'
                 f'<span class="lk-go" aria-hidden="true">↗</span>')
        out.append(ext(url, inner, "lk"))
    out.append("</div>")
    return "".join(out)

def crumbs(pre, label):
    return f'<nav class="crumbs"><a href="/">Towananika</a> ／ <a href="{pre}">HIYOKO</a> ／ {label}</nav>'

# ---------- home ----------
row = "".join(ext(u, brand(c), f"sns {c}").replace('<a ', f'<a aria-label="{n}" title="{n}" ', 1)
              for c, ic, n, _, _, u in SNS[:2] + SNS[3:] + COMMUNITY)
# home tiles follow the sitemap: "know HIYOKO" and "browse"
TILE_GROUPS = [
    (t("よく使う", "Most used", "자주 쓰는 곳"), [
        ("analysis/", "📊", "SNS分析", "XとInstagramの数字"),
        ("x/report/", "📝", "レポート", "最新の調査と分析"),
        ("kpi/", "🔎", "投稿一覧", "全投稿の数字を並べ替え")]),
    (t("HIYOKOを知る", "Get to know HIYOKO", "HIYOKO 알아보기"), [
        ("about/", "🐣", "HIYOKOを知る", "しくみ・目的・キャラクター"),
        ("links/", "🔗", "公式リンク集", "公式SNS・公式サイトを1か所に"),
        ("news/", "📰", "開発ニュース", "サイトの更新内容")]),
]
IN_LINK = t("🔒 社内資料（関係者のみ）", "🔒 Internal (members only)", "🔒 내부 자료 (관계자 전용)")
tiles = "".join(
    f'<h2 class="tg-h">{g}</h2><div class="tiles">'
    + "".join(f'<a class="tile" href="{h}"><span class="ti" aria-hidden="true">{i}</span><strong>{tt}</strong><em>{d}</em></a>' for h, i, tt, d in items)
    + "</div>" for g, items in TILE_GROUPS) + f'<p class="in-link mem-only"><a href="internal/strategy/">{IN_LINK}</a></p>'

# ---------- news (site update log; append to news.json on every change) ----------
HERE = os.path.dirname(os.path.abspath(__file__))
NEWS = sorted(json.load(open(os.path.join(HERE, "news.json"), encoding="utf-8")), key=lambda r: (r[0], r[1]), reverse=True)
PR_URL = "https://github.com/towananika/towananika.github.io/pull/"
def jdate(d):
    y, m, dd = d.split("-"); return f"{int(y)}年{int(m)}月{int(dd)}日"
def news_items(rows, pre):
    return "".join(f'<li><span class="nw-t">{r[2]}</span> {ext(PR_URL + str(r[1]), f"#{r[1]}", "nw-pr")}</li>' for r in rows)
latest = (f'<section class="news-mini" aria-labelledby="nm-h"><div class="nm-head"><h2 id="nm-h">📰 最近の更新</h2><a href="news/">すべて見る →</a></div>'
          '<ul class="nw">' + "".join(f'<li><span class="nw-d">{jdate(r[0])}</span><span class="nw-t">{r[2]}</span></li>' for r in NEWS[:3]) + "</ul></section>")
# keep the KO/EN dictionary for the news lines inside i18n.js in sync
_i18n = os.path.join(ROOT, "i18n.js"); _src = open(_i18n, encoding="utf-8").read()
_block = "/*news*/Object.assign(D," + json.dumps({r[2]: [r[3], r[4]] for r in NEWS}, ensure_ascii=False) + ");/*/news*/\n"
_src = re.sub(r"/\*news\*/.*?/\*/news\*/\n", "", _src, flags=re.S)
_k = _src.index("var L=["); open(_i18n, "w", encoding="utf-8").write(_src[:_k] + _block + _src[_k:])

QUICK = [("analysis/", "📊", "SNS分析", "XとInstagramの数字"),
         ("x/report/", "📝", "最新のレポート", "調査と分析のまとめ"),
         ("about/", "🐣", "HIYOKOを知る", "しくみ・目的・キャラクター"),
         ("links/", "🔗", "公式リンク集", "公式SNS・公式サイトを1か所に")]
quick = '<nav class="qnav" aria-label="おもな入口">' + "".join(
    f'<a class="qn" href="{h}"><span class="ti" aria-hidden="true">{i}</span><span><strong>{tt}</strong><em>{d}</em></span></a>' for h, i, tt, d in QUICK) + "</nav>"
last = NEWS[0]
home = f"""<section class="hh">
<div class="hh-text">
<h1>HIYOKO</h1>
<p class="hh-copy">{t("小さなひよこ、大きなエネルギー。", "One little chick, big energy.", "작은 병아리, 큰 에너지.")}</p>
<p class="hh-sub">{t("HIYOKOをもっと楽しむための、ファンのまとめページです。", "A fan-made guide to enjoying HIYOKO more.", "HIYOKO를 더 즐기기 위한 팬 정리 페이지입니다.")}</p>
<nav class="sns-row" aria-label="公式SNS">{row}</nav>
</div>
<figure class="hh-fig"><div class="hh-art"><img src="img/hiyoko-wave.webp" width="480" height="480" alt="{t("手をふるHIYOKO", "HIYOKO waving", "손을 흔드는 HIYOKO")}"></div>
<figcaption class="hh-src">{t("絵：", "Art: ", "그림: ")}<a href="https://www.instagram.com/p/DfT-mQrjZ0A/" target="_blank" rel="noopener">{t("公式Instagram @hiyoko_global より", "from official Instagram @hiyoko_global", "공식 Instagram @hiyoko_global에서")}</a>（© HIYOKO）</figcaption></figure>
</section>
{quick}
<section class="feed-box home-feed" data-hide-empty hidden aria-label="お知らせ"><div class="feed-head"><h2>📣 お知らせ</h2><a href="news/#oshirase">すべて見る →</a></div><div class="feed" data-feed="news" data-limit="3" data-base="x/report/" data-hide-empty></div></section>
<script src="report.js" defer></script>
<div class="hh-foot"><a class="hh-news" href="news/"><span class="hh-tag">{t("最新", "Latest", "최신")}</span><span class="hh-nt">{last[2]}</span><span aria-hidden="true">→</span></a><a class="hh-in mem-only" href="internal/strategy/">🔒 社内資料</a></div>"""
shell("", "HIYOKO 非公式ファンサイト", "HIYOKOの非公式ファンサイト。公式リンク集、プロジェクト、キャラクター、目的、SNS分析をまとめています。", home)

# ---------- links ----------
links = f"""{crumbs("../", "公式リンク集")}
<h1>🔗 公式リンク集</h1>
<p class="fan-note">このページは非公式ファンサイトです。HIYOKOの公式サイト・公式Linktree・公式Instagramに載っているリンクを、ファンが集めました（{CHECKED}に確認）。</p>
<h2 id="sns">公式SNS</h2>
{cards(SNS)}
<h2 id="community">コミュニティ</h2>
{cards(COMMUNITY)}
<h2 id="site">公式サイト</h2>
{cards(SITES)}
<h2 id="trade">HYKを買う・取引する</h2>
<p class="warn">⚠️ 投資のすすめではありません。暗号資産は値動きが大きく、お金が減ることもあります。買う前に公式サイトの説明と注意書きを読んでください。</p>
{cards(TRADE)}
<h2 id="service">公式サービス</h2>
<p class="warn">⚠️ HIYOKOが運営するサイトはこの3つだけです。ウォレットをつなぐ前に、アドレスを必ず確かめてください。</p>
{cards(SERVICES)}
<h2 id="fun">たのしむ</h2>
{cards(FUN)}
<h2 id="sources">出典</h2>
<ul class="srcs">
<li>{ext("https://hiyokotoken.com/", "公式サイト hiyokotoken.com ↗", "")}：ページ下の公式SNS・公式サイト一覧</li>
<li>{ext("https://linktr.ee/HIYOKO_global", "公式Linktree ↗", "")}：公式Instagramのプロフィールにあるリンク</li>
<li>{ext("https://www.instagram.com/hiyoko_global/", "公式Instagram ↗", "")}：プロフィール</li>
</ul>
<p class="note">ここにないリンクは、公式のものか確かめられていません。にせものに注意してください。</p>"""
shell("links/", "公式リンク集 | HIYOKO 非公式ファンサイト", "HIYOKOの公式SNS・公式サイト・取引所・公式サービスのリンクを、非公式ファンサイトが出典つきで集めたページ。", links,
      toc=[("sns", "公式SNS"), ("community", "コミュニティ"), ("site", "公式サイト"), ("trade", "HYKを買う・取引する"), ("service", "公式サービス"), ("fun", "たのしむ"), ("sources", "出典")])

# ---------- about ----------
FLOW = [("🎮", "遊ぶ・健康の活動"), ("🪙", "CheePointをためる"), ("🔁", "外部プラットフォームで交換"), ("💎", "HYKを持つ・取引"), ("🌱", "ステーキングなど")]
flow = '<ol class="flow">' + "".join(f'<li><span aria-hidden="true">{i}</span>{t}</li>' for i, t in FLOW) + "</ol>"
PARTS = [
    ("🎮", "Happy Chick", "ゲームの入口", "1万本以上のゲームが遊べるエミュレーター。ウォレットなしでCheePointがたまる。"),
    ("🪙", "CheePoint", "ポイント", "トークンではなく、価格もない。ふだんの活動とHYKをつなぐ橋。"),
    ("💎", "HYK", "中心のトークン", "BNB Smart Chain（BEP-20）。発行数10億。CoinStoreで取引できる。"),
    ("💚", "Vitalis", "健康（HealthFi）", "虹彩認証と健康レポート。HYKで払うと割引。"),
    ("🤝", "コミュニティ", "仲間づくり", "SNS・Telegram・イベント。東南アジアが中心。"),
]
parts = '<div class="parts">' + "".join(
    f'<div class="part"><span class="ti" aria-hidden="true">{i}</span><strong>{n}</strong><em>{r}</em><p>{d}</p></div>' for i, n, r, d in PARTS) + "</div>"
ROAD = [
    ("done", "2026年 4〜6月", "完了", ["CoinStoreに上場", "ホワイトペーパーを更新", "SNS・コミュニティの戦略"]),
    ("now", "2026年 7〜9月", "進行中", ["東南アジアでキャンペーン", "Vitalisの紹介ページ", "オフラインイベントの計画"]),
    ("next", "2026年 10〜12月", "予定", ["CheePointキャンペーンを拡大", "外部プラットフォームの開発", "HYKで払う特典を決める"]),
    ("later", "2027年〜", "これから", ["CheePointとHYKの交換", "Vitalisを広げる", "ステーキング・新しい上場"]),
]
road = '<ol class="road">' + "".join(
    f'<li class="{c}"><span class="rd-when">{w}</span><span class="rd-st">{s}</span><ul>' + "".join(f"<li>{x}</li>" for x in xs) + "</ul></li>"
    for c, w, s, xs in ROAD) + "</ol>"
about = f"""{crumbs("../", "HIYOKOとは")}
<h1>🐣 HIYOKOを知る</h1>
<p class="fan-note">公式サイト（hiyokotoken.com）の内容を、ファンがやさしくまとめたものです。</p>
<p class="big">ゲームと健康の活動を、ポイントからトークン（HYK）へつなぐ、Web3のしくみです。</p>
<h2 id="idea">考え方</h2>
<p class="pill">まず楽しむ。トークンは、あとから。</p>
{flow}
<h2 id="parts">プロジェクト</h2>
{parts}
<h2 id="roadmap">ロードマップ</h2>
<div class="meta">公式サイトの表示（{CHECKED}時点）</div>
{road}
<p class="more">{ext("https://hiyokotoken.com/ecosystem/", "公式サイトでくわしく見る ↗", "btn")} {ext("https://hiyokotoken.com/whitepaper/", "ホワイトペーパー ↗", "btn ghost")}</p>
<details class="fold"><summary>このページについて</summary><p class="note">投資のすすめではありません。予定は変わることがあります。くわしくは公式サイトで確かめてください。</p></details>"""
# about/ is written at the end, together with 目的 and キャラクター (one page since 2026-11-27)

# ---------- character ----------
PROF = [  # official site "Meet Hiyoko" only
    (t("名前", "Name", "이름"), "HIYOKO", False),
    (t("すがた", "Looks", "모습"), t("ひよこのマスコット", "A chick mascot", "병아리 마스코트"), False),
    (t("キャッチコピー", "Tagline", "캐치프레이즈"), "One little chick, big energy", False),
    (t("役わり", "Role", "역할"), t("エコシステムのあちこちに登場して、HYKを応援する", "Shows up all over the ecosystem, cheering HYK on", "에코시스템 곳곳에 등장해 HYK를 응원한다"), False),
]
TBD = ' class="tbd"'
prof = '<dl class="prof">' + "".join('<div'+(TBD if t else '')+f'><dt>{k}</dt><dd>{v}</dd></div>' for k, v, t in PROF) + "</dl>"
POSTS = ["DfJP9ZOSMQ7", "Dacae4hAXKB", "DbfXFgBDPRi", "DapSaK4jIGK", "DbFnGHnjK-b", "Df1c4q1BpRE"]
poses = "".join(f'<div class="ig-cell">{igpost(c)}</div>' for c in POSTS)
chara = f"""{crumbs("../", "キャラクター")}
<h1>🐤 キャラクター</h1>
<p class="fan-note">{t("プロフィールは、公式サイトに書かれていることだけをファンがまとめています。", "The profile only uses what the official site says, summarized by fans.", "프로필은 공식 사이트에 적힌 내용만 팬이 정리했습니다.")}</p>
<div class="chara">
<div class="chara-pic"><img src="../img/hiyoko-wave.webp" width="480" height="480" alt="{t("手をふるHIYOKO", "HIYOKO waving", "손을 흔드는 HIYOKO")}"></div>
<div><div class="chara-name">HIYOKO</div><div class="chara-catch">One little chick, big energy</div></div>
</div>
<h2 id="profile">プロフィール</h2>
{prof}
<p class="more">{ext("https://hiyokotoken.com/", t("出典：公式サイト ↗", "Source: official site ↗", "출처: 공식 사이트 ↗"), "btn ghost")}</p>
<h2 id="poses">いろいろなHIYOKO</h2>
<div class="igs">{poses}</div>
{CREDIT}
<details class="fold"><summary>このページについて</summary><p class="note">{t("絵は公式Instagramの投稿の画像です（© HIYOKO）。性格や物語などは公式文書に書かれていないため、のせていません。", "Art is from official Instagram posts (© HIYOKO). Personality and story are not in the official documents, so they are not shown.", "그림은 공식 Instagram 게시물의 이미지입니다(© HIYOKO). 성격이나 이야기는 공식 문서에 없어 싣지 않았습니다.")}</p></details>"""


# ---------- vision ----------
VAL = [
    ("🔐", "あなたのもの", "遊んで手に入れたアイテムも、自分の健康データも、あなたのものとして持てるように。"),
    ("🎮", "楽しさから", "最初から暗号資産を知らなくていい。まず遊んで、ポイントをためて、あとからつなぐ。"),
    ("🤝", "みんなで", "SNS・Telegram・イベントで、東南アジアを中心に仲間を広げる。"),
]
vals = '<div class="parts vals">' + "".join(f'<div class="part"><span class="ti" aria-hidden="true">{i}</span><strong>{t}</strong><p>{d}</p></div>' for i, t, d in VAL) + "</div>"
vision = f"""{crumbs("../", "目指すこと")}
<h1>🌱 目指すこと</h1>
<p class="fan-note">公式サイトの内容から、ファンが読みとってまとめたものです。公式のことばではありません。</p>
<div class="motto">
<p class="motto-cap">ファンのひとことまとめ</p>
<p class="motto-main">「あなたのものは、ずっとあなたのもの」🐣</p>
<p class="motto-sub">ゲームのアイテムも、健康データも。</p>
</div>
<h2 id="values">大事にしていること</h2>
{vals}
<h2 id="goals">目標</h2>
<a class="tile lock mem-only" href="../internal/strategy/"><span class="ti" aria-hidden="true">🔒</span><strong>数字の目標は社内資料に</strong><em>ログインして開く</em></a>"""
print("ok")

# ---------- news page ----------
dates = []
for r in NEWS:
    if r[0] not in dates: dates.append(r[0])
news = f"""{crumbs("../", "ニュース")}
<h1>📰 ニュース</h1>
<section class="feed-box" aria-labelledby="nw-feed-h"><div class="feed-head"><h2 id="oshirase">📣 お知らせ</h2><a class="btn btn-sm" data-write hidden href="../x/report/new/?kind=news">＋ 書く</a></div>
<div class="feed" data-feed="news" data-base="../x/report/"><div class="rpt-empty">読み込んでいます…</div></div></section>
<h2 id="dev">🛠 サイトの更新記録</h2>
<div class="meta">このファンサイトの更新内容です。新しい順。</div>
<script src="../report.js" defer></script>
""" + "".join(f'<h3 id="d{d.replace("-", "")}">{jdate(d)}</h3><ul class="nw">{news_items([r for r in NEWS if r[0] == d], "../")}</ul>' for d in dates)
shell("news/", "ニュース | HIYOKO 非公式ファンサイト", "HIYOKO非公式ファンサイトのお知らせと、サイトの更新記録。", news,
      toc=[("oshirase", "お知らせ"), ("dev", "サイトの更新記録")])
print("news", len(NEWS))

# ---------- purpose (ONLY what the official site / whitepaper say; user rule 2026-11-20) ----------
def wcard(icon, title, body, sources):
    links = " ".join(ext(u, f"{l} ↗", "wsrc") for u, l in sources)
    return (f'<div class="wcard"><span class="ti" aria-hidden="true">{icon}</span><div><strong>{title}</strong><p>{body}</p>'
            f'<div class="wsrcs">{links}</div></div></div>')
OH = ("https://hiyokotoken.com/", t("公式サイト", "Official site", "공식 사이트"))
OE = ("https://hiyokotoken.com/ecosystem/", t("公式サイト：エコシステム", "Official site: Ecosystem", "공식 사이트: 에코시스템"))
OW = ("https://hiyokotoken.com/whitepaper/", t("ホワイトペーパー v0.6", "Whitepaper v0.6", "백서 v0.6"))
PURPOSE = [
    ("🔁", t("ゲーム・ポイント・健康を、1つの流れに", "Games, points and wellness in one loop", "게임·포인트·건강을 하나의 흐름으로"),
     t("ゲームの活動、ポイント、健康への取り組みを、HYKで1つの価値の流れにつなぐ。", "HYK connects game activity, reward points and wellness into one value circulation model.", "게임 활동, 포인트, 건강 활동을 HYK로 하나의 가치 흐름에 잇는다."), [OH]),
    ("🎮", t("まず遊んでポイント、トークンはあとから", "Earn points first, connect to HYK later", "먼저 놀며 포인트, 토큰은 나중에"),
     t("楽しむ部分とトークンの部分を分ける。最初はウォレットなしで遊んでCheePointをため、HYKにはあとからつなぐ。", "The fun part and the token part are kept apart: play and earn CheePoint without a wallet, and connect to HYK later.", "즐기는 부분과 토큰 부분을 나눈다. 처음엔 지갑 없이 놀며 CheePoint를 모으고, HYK에는 나중에 잇는다."), [OH, OE]),
    ("🪙", t("CheePointはトークンではない", "CheePoint is not a token", "CheePoint는 토큰이 아니다"),
     t("CheePointはシンプルなポイント。トークンではなく、価格もない。", "CheePoint is a simple reward-point layer: not a token, and it has no price.", "CheePoint는 단순한 포인트. 토큰이 아니며 가격도 없다."), [OE]),
    ("📄", t("価格の約束はしない", "No price guarantees", "가격을 약속하지 않는다"),
     t("買い戻し・分配などのしくみは、供給の管理のためで、価格を約束するものではない。", "Buyback and distribution are for managing supply, not for guaranteeing a price.", "바이백·분배 등의 구조는 공급 관리를 위한 것이며 가격을 약속하지 않는다."), [OW]),
]
W_T = t("目的", "Purpose", "목적")
world = f"""{crumbs("../", W_T)}
<h1>{t("🎯 目的", "🎯 Purpose", "🎯 목적")}</h1>
<p class="fan-note">{t("公式サイトとホワイトペーパーに書かれていることだけを、ファンがまとめました。それぞれに出典のリンクがあります。", "Fans summarized only what the official site and whitepaper say. Each item links to its source.", "공식 사이트와 백서에 적힌 내용만 팬이 정리했습니다. 각 항목에 출처 링크가 있습니다.")}</p>
<h2 id="purpose">{t("公式に書かれている目的", "The purpose, as officially stated", "공식적으로 적힌 목적")}</h2>
<div class="wcards">{"".join(wcard(*r) for r in PURPOSE)}</div>
<p class="note">{t("内容や予定は変わることがあります（公式の注意書きより）。投資のすすめではありません。", "Features and timelines may change (per the official notice). This is not investment advice.", "내용과 일정은 바뀔 수 있습니다(공식 안내). 투자 권유가 아닙니다.")}</p>"""

# ---------- HIYOKOを知る = one page: しくみ + 目的 + キャラクター (2026-11-27) ----------
def _body(h):  # drop crumbs + h1 + first fan-note of a sub page, keep the rest
    h = re.sub(r'^.*?</h1>\n', '', h, count=1, flags=re.S)
    return re.sub(r'^<p class="fan-note">.*?</p>\n', '', h, count=1, flags=re.S)
_w = _body(world).replace('<h2 id="purpose">', '<h2 id="purpose-h">', 1)
_c = _body(chara).replace('<h2 id="profile">プロフィール</h2>', '<h3 id="profile">プロフィール</h3>').replace('<h2 id="poses">いろいろなHIYOKO</h2>', '<h3 id="poses">いろいろなHIYOKO</h3>')
_c = _c.replace('src="../img/', 'src="../img/')
know = (about.replace('<details class="fold"><summary>このページについて</summary>', '<!--aboutfold--><details class="fold"><summary>このページについて</summary>', 1).split('<!--aboutfold-->')[0]
        + f'<h2 id="purpose">{W_T}</h2>\n' + _w.split('</h2>', 1)[1]
        + f'<h2 id="character">キャラクター</h2>\n' + _c
        + '<details class="fold"><summary>このページについて</summary><p class="note">投資のすすめではありません。予定は変わることがあります。くわしくは公式サイトで確かめてください。</p></details>')
shell("about/", "HIYOKOを知る | HIYOKO 非公式ファンサイト", "HIYOKOのしくみ・ロードマップ・目的・キャラクターを、公式サイトとホワイトペーパーからまとめたページ。", know,
      toc=[("idea", "考え方"), ("parts", "プロジェクト"), ("roadmap", "ロードマップ"), ("purpose", W_T), ("character", "キャラクター")])
# old URLs keep working
def _redir(path, to, label):
    os.makedirs(os.path.join(ROOT, path), exist_ok=True)
    open(os.path.join(ROOT, path, "index.html"), "w", encoding="utf-8").write(
        f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
        f'<meta http-equiv="refresh" content="0; url={to}"><link rel="canonical" href="../about/">'
        f'<title>HIYOKO</title></head><body><p><a href="{to}">{label}へ</a></p></body></html>\n')
_redir("world", "../about/#purpose", "目的")
_redir("character", "../about/#character", "キャラクター")
_redir("vision", "../about/#purpose", "目的")

# flush generated translations into i18n.js (between /*gen*/ markers)
_src = open(_i18n, encoding="utf-8").read()
_src = re.sub(r"/\*gen\*/.*?/\*/gen\*/\n", "", _src, flags=re.S)
_k = _src.index("var L=[")
open(_i18n, "w", encoding="utf-8").write(_src[:_k] + "/*gen*/Object.assign(D," + json.dumps(TR, ensure_ascii=False) + ");/*/gen*/\n" + _src[_k:])
print("tr", len(TR))
