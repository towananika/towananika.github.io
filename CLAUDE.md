# towananika.github.io（とわなにか）

towananika の公開サイトはすべてこの1つのリポジトリにある（2026-11-21 に統合）。URL はフォルダ名そのまま。

| フォルダ | 公開URL | 中身 | 作業メモ |
|---|---|---|---|
| `drive/` | /drive/ | ゲーム「漢江ハイウェイ」（ドライブ。元は claude.ai のアーティファクト。ここではオフラインで動き、記録・チャットは出ない） | — |
| `hibiki/` | /hibiki/ | ひびきのライフサイト | `hibiki/CLAUDE.md` |
| `hiyoko/` | /hiyoko/ | HIYOKO ファンサイト | — |
| `nacha/` | /nacha/ | NACHA | `nacha/NACHA_CORE.md` |
| `remitech/` | /remitech/ | REMITECH HUB | `remitech/CLAUDE.md` |
| `tool/` | /tool/ | 生活の道具（為替・保証金など） | `tool/CLAUDE.md` |
| `triathlon/` | /triathlon/ | ゲーム「トライアスロン」 | `triathlon/AGENTS.md` |

- 作業は該当フォルダの中で。そのフォルダの CLAUDE.md / AGENTS.md の決まりに従う。コマンド（`node tools/...` など）もそのフォルダで実行する。
- サイト全体に効くもの: `.nojekyll`（Jekyll なし。`.md` はそのまま配る）、`404.html`（全体で1枚。`nacha/404.html` はここから読む）、`.github/workflows/`（Actions はルートにしか置けない。`hibiki-youtube-reader.yml`、`hibiki-youtube-summary.yml`（Gemini で要約、Secrets の GEMINI_API_KEY）、`tool-rates.yml`）。
- 1つのフォルダの変更が他のフォルダに混ざらないよう、コミットとPRはフォルダごとに分ける。
- 以前の別リポジトリ（towananika/hibiki・nacha・tool・remitech・triathlon）は履歴ごとここに取り込んだ。`git log -- hibiki/` で見られる。
