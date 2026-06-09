# MangaLover_H — 受け皿サイト

Renta! アフィリエイト購入導線。X(MangaLover_H)で気になった人がその場で買える場所。
ダーク／心理／鬱・introspective 系の seinen を、英語圏読者向けに**一人のキュレーター人格**でレビューする。
tsumitate-navi と同型の「GitHub Actions + Claude API 自動更新」構成。

> **コアは文体。** 自動生成しても「won't lead you wrong のキュレーター人格」が消えたら
> 海外の量産レビューサイトと同じになる。`prompts/review-prompt.md` が心臓部。

---

## 仕組み（30秒で）

```
けいた: content/works/ に「作品名＋角度メモ」だけ書いて push
        │
        ▼
GitHub Actions
  ├─ generate.js  draftを拾う → Claude API が本文/タグ/HOOK/比較を生成 → 書き戻し published化
  ├─ コミットし戻す（再生成防止）
  └─ build.js     Markdown → 静的HTML → GitHub Pages へデプロイ
```

けいたが握るのは **作品選定** と **mood/角度メモ** だけ。あとは回る。

---

## けいたの作業（これだけ）

1. `content/works/_TEMPLATE.md` をコピー、英題スラッグでリネーム（例 `monster.md`）
2. 上の4〜5行（`title_en` / `title_ja` / `renta_url` / `mood_note` / `status: draft`）を埋める
3. commit & push → 自動で生成・公開

詳細は [`content/works/README.md`](content/works/README.md)。

---

## ディレクトリ

```
prompts/review-prompt.md   ← 文体プロンプト（心臓部・差別化の源泉）
content/works/*.md         ← 作品エントリ（けいたが追加）
templates/                 ← ページ雛形（HTML）
assets/style.css           ← デザイン（quiet/literary/dark）
scripts/
  config.js                ← サイト名・URL・mood doors・モデル設定
  generate.js              ← Claude API でレビュー生成
  build.js                 ← 静的サイトビルド
  lib.js                   ← 共通処理
.github/workflows/build.yml ← 自動更新パイプライン
dist/                      ← ビルド成果物（gitignore）
```

---

## ローカルで動かす

```bash
npm install
cp .env.example .env          # ANTHROPIC_API_KEY を入れる
npm run generate              # draft を生成（API キー必要）
npm run build                 # dist/ に静的サイト生成
npm run serve                 # http://localhost:8080 で確認
```

`npm run build` だけなら API キー不要（生成済み published のみビルド）。

---

## 初期セットアップ（一度だけ）

1. このフォルダを GitHub リポジトリにして push
2. **Settings → Secrets and variables → Actions** に `ANTHROPIC_API_KEY` を登録
3. **Settings → Pages → Source: GitHub Actions** に設定
4. 独自ドメインを使うなら Pages にカスタムドメインを設定し、`scripts/config.js` の `SITE_URL` を更新
   （※ note/lit.link より独自ドメイン推奨。Renta! リンクの自由度・信頼性で有利）

---

## 公開までの最短ルート（設計書 §6）

- [x] 器（このリポジトリ構成）
- [x] 文体プロンプト固定
- [x] 1作品ページ／トップのテンプレ
- [x] 投入フォーマット
- [x] GitHub Actions パイプライン
- [ ] 初期10〜20作品を投入（`content/works/` に角度メモを追加）
- [ ] Renta! / バリューコマース提携申請に出せる体裁を確認 → 申請

---

## 守るルール（自動化しても死守）

- 作品選定はAIに丸投げしない。「俺が紹介したい漫画」という熱がコア。
- 本文はネタバレ禁止。深掘りは折りたたみ＋明示でネタバレ隔離（自動で `<details>` 化）。
- 文体プロンプトを薄めない。平均化したら埋もれる。
- 原題併記・mood入口・「if you liked X」比較は差別化の3点セット。崩さない。
```
