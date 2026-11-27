# HIYOKO ファンサイト 引き継ぎメモ（2026-11-23）

公開: https://towananika.github.io/hiyoko/ （このリポジトリの `hiyoko/` フォルダ。main に入ると GitHub Pages に1〜2分で出る）
依頼主は日本語でやりとりする非エンジニア。短い指示でも意図をくみ、結論から、やさしい日本語で答える。UI は見なれた形・画像中心・文字は少なく。

## 必ず守ること
1. **非公式ファンサイト**。どのページにも「非公式ファンサイト」の表示を出し続ける（公式と誤解させない）。
2. **公開ページに書いてよいのは、公式サイト（hiyokotoken.com、/ecosystem/）とホワイトペーパー v0.6 に書かれていることだけ**。SNS投稿から読み取った設定（性格・物語など）は書かない。SNS分析・KPI の数字は公開でよい（依頼主が決定ずみ）。
3. **社内資料は一般の人に見せない**。入口には class `mem-only` をつけ、`account.js` が関係者と確認したとき（`html.is-member`）だけ出る。中身はサーバー（hibiki-sync、リポジトリ towananika/hibiki の `worker/hiyoko.js`）にだけ置き、このリポジトリには入れない。開発ニュースにも社内資料のことは書かない。
4. ヘッダーの「Towananika › HIYOKO」はオーナーだけに出す（`html.is-owner`、account.js がサーバーの `list` で確認）。本文上のパンくず `.crumbs` は全ページ非表示。
5. **サイトを変えたら毎回、開発ニュース（/hiyoko/news/）に1件足す**（`tools/news.json` に `[日付, PR番号, 日本語, English, 한국어]`）。
6. **PR は自分でマージしてよい**（squash）。確認してからマージし、結果を報告する。コミット・PR は `hiyoko/` だけで1つ（ほかのフォルダと混ぜない）。
7. 平均を出すときは、とびぬけた値（IG のバズ投稿、X の急増日）を外し、「特別」として別に見せる。
8. 新しい日本語の文言は `i18n.js` に韓国語・英語を足す（足さないと日本語のまま）。`Object.assign(D,{...})` の行を `var L=[` の前に追加する。
9. 表示確認はスマホ幅 390px（ライト・ダーク）と 1280px。横スクロールが出ないこと。

## 作り直しの手順（`hiyoko/tools/`）
- `python3 tools/gen_portal.py <repo>/hiyoko` … ホーム・HIYOKOを知る・公式リンク・ニュースなど（`tools/news.json` を読む）
- `python3 tools/build_nav.py <repo>/hiyoko` … 全ページのタブ・左ナビ・サイトマップ・`?v=` キャッシュ対策。**ページを変えたら最後に必ず実行**。ナビの項目は中の `GROUPS` と `PAGES`。
- SNS分析トップ `/hiyoko/analysis/`（`tools/weekly/`）
  - `build_data.py` … 書き出しCSV → `data.json`（X 日別・投稿別、IG 投稿別。分類ずみCSVも使う）
  - `main.html` … 文言（ひとこと `HEAD`、時期 `PH`、週メモ `NOTES`、特別週 `SP`）とJS。`wa.css` … 見た目
  - `assemble.py` … `analysis/index.html` の `<main>` を差し替え、`style.css` の末尾の `/* weekly analysis + trend` 以降を置きかえる
- KPI一覧 `/hiyoko/kpi/`：`kpi_data.py` → `kpi.json`、`kpi_main.html`・`kpi.css`、`kpi_assemble.py`
- スクリプト内のパス（`/mnt/...`、`/home/claude/...`）は前の作業環境のもの。自分の環境に合わせて書きかえる。
- データの入手：X は X Analytics の「アカウントの概要」（日別）と「投稿」の書き出しCSV、IG は Meta の投稿別書き出しCSV（韓国語の見出し）。依頼主にもらう。投稿別の書き出しは最新236件程度しか出ない。

## ページの構成（SNS分析）
- `analysis/` … X / Instagram × 「概要」（これまでの流れ・週ごと・週の記録・Xの特別な日）／「コンテンツ」（形式・テーマ別の強さ、投稿ランキング、IGのバズ投稿）。期間 1・3・6ヶ月・全期間。`#x-content` などで直接開ける
- `kpi/` … 事実の数字だけ。画像プレビュー（公式埋め込み iframe）／リスト、並べ順ドロップダウン（基本・反応ごと・フォローにつながる行動）、カードに「反応の内わけ」「フォローにつながる行動」
- 古いページ（`x/` `ig/` `x/posts/` など）も残っている

## 残っていること
- 週ごとの更新：新しい書き出しをもらったら `build_data.py`・`kpi_data.py` をやり直し、`NOTES` にその週の「気づき・次に試すこと」を足す。X の新しい投稿（11/20以降）は形式・テーマの分類がまだ。
- IG の 11/16〜22 の週のデータ待ち。
- サーバー（towananika/hibiki の worker）の変更は、依頼主のPCで `worker/` に入り `npx --yes wrangler deploy` で反映する（本番への操作なので依頼主の OK が必要）。

## 今後の案：KPIの注目マーク（未実装）
依頼主が「いつか使えるかも」と保存を希望。実装を依頼されるまではサイトに追加しない。
- XとInstagramを別々に、直近3ヶ月の投稿を対象にKPIごとに比較し、上位10%の数値の横に「注目」マークを表示する案。タップ・カーソルで判定理由を見せる。
- 比較対象が20投稿未満の場合と、対象KPIが0の場合はマークなし。3ヶ月より古い投稿にも付けない。
- 反応率は表示（X）またはリーチ（IG）が100以上の投稿のみ対象。
- とびぬけた投稿は「特別」として通常の投稿と区別。実装時は上位10%の同値・外れ値の扱いと基準日を明確にする。

## 投稿の仕組み（2026-11-27）：レポート・ニュース・社内資料
- 書く画面 `/hiyoko/x/report/new/`（`?kind=report|news|internal`）、自分の投稿 `/hiyoko/x/report/mine/`、1件 `/hiyoko/x/report/view/?id=…`。動きは `report.js`。
- 一覧：レポート＝`x/report/`、ニュース＝`news/` の「お知らせ」とホーム、社内資料＝`internal/strategy/`（会員だけ）。`<div data-feed="news|internal">` で表示。
- 中身はサーバー（hibiki-sync、towananika/hibiki の `worker/hiyoko.js`）だけに置く。社内資料（kind=internal）は会員にしか返さない。
- **AI が投稿するとき**：自分の会員ID（招待コードで join、AI 用の鍵）で投稿する。依頼主のログインは使わない。
  ```
  curl -s https://hibiki-sync.jaykim-can.workers.dev/hiyoko/rput -H 'Content-Type: application/json' -H "X-Hiyoko-Key: $HIYOKO_KEY" \
    -d '{"kind":"report","title":"…","sum":"結論を1文で","body":"## わかったこと\n- …"}'
  ```
  `"draft":true` で下書き。直すときは `"id"` をつける。本文は `## 見出し` `- 箇条書き` `**太字**` `| 表 |` `![説明](https://…)`。
- クラウドの Claude から送るには、環境のネットワーク設定で `hibiki-sync.jaykim-can.workers.dev` を許可しておく必要がある。
- 静的なレポートページはもう作らない（サーバーに登録する）。
