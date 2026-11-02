# プロジェクト規約

## 開発フロー

## 2つのルート

- **通常ルート（AIを組み込まないアプリ）**：`~/code/ideas` で構想 → AI Studio Build で試作 → GitHub → `/from-studio` でここに取り込み → `/build` → `/verify`。下の表の 2〜4 は使わない。
- **AI機能ありルート**：下の表を 1 から順に進める。


| 段階 | 誰が | コマンド | 成果物 |
| --- | --- | --- | --- |
| 1. 構想 | Claude Code | `/app-idea` | `docs/concept.md` |
| 2. AI Studio向け指示書 | Claude Code | `/studio-brief <機能名>` | `prompts/<機能名>/brief.md`, `cases.jsonl` |
| 3. プロンプト・スキーマ確定 | 人間（AI Studio） | — | `prompts/<機能名>/` に結果を保存 |
| 4. 取り込み・評価 | Claude Code | `/studio-import <機能名>` | `docs/spec.md` 更新、評価レポート |
| 5. 実装 | Claude Code | `/build` | `src/` |
| 6. 検証 | Claude Code | `/verify` | 検証レポート |
| 7. 振り返り | Claude Code | `/retro <気づき>` | `docs/retro.md`、改善タスク、`~/code/ideas/LESSONS.md` |

段階を飛ばさない。AI機能がないアプリは 2〜4 を省略してよい。

## ルール

- `prompts/<機能名>/` の `system_prompt.md` `schema.json` `config.json` は AI Studio で確定した**正本**。実装側で勝手に書き換えない。変更が必要になったら理由を示して提案し、`/studio-brief` に戻る。
- 実装はプロンプトやスキーマを**コードにコピペせず、`prompts/` から読み込む**（正本を1か所に保つため）。
- Gemini の APIキーはフロントエンドに絶対に置かない。サーバー側（Firebase Functions / Cloud Run など）を経由させる。
- 生徒の個人情報（氏名・出席番号など）を API に送らない設計にする。
- 1機能ずつ実装し、動いたらコミットする。
- 利用者は中高生と教員。端末は Chromebook / iPad / スマホを想定し、狭い画面でも使えること。

## コマンド

- プロンプト評価: `node --env-file=.env scripts/eval-prompt.mjs <機能名>`
- 開発サーバー: `npm run dev`（ポート3000）
- 型チェック: `npm run lint`
- 遺伝モデルの試算: `npm run check`
- ビルド: `npm run build`

## 技術スタック

Vite + React + TypeScript + Tailwind v4。サーバーなしの静的アプリ（保存は localStorage）。遺伝の計算は `src/utils/genetics.ts` に集約。用語は現行教科書に合わせ「顕性・潜性」を使う。
