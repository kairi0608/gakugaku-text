# ガクガク教材Hub Local

ローカルPCだけで動く、AI教材生成・学習・採点・成長記録アプリです。教材、回答、キャラクターは `data/` に保存され、外部DB・認証・クラウド配備は不要です。

## 必要環境

- Node.js 22以上
- pnpm 11以上

## 起動

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm db:migrate
pnpm dev
```

ブラウザで `http://localhost:3000` を開きます。AI機能には `.env.local` の `OPENAI_API_KEY`、`OPENAI_TEXT_MODEL`、`OPENAI_IMAGE_MODEL` を設定します。キーがなくても画面・ローカル教材・学習・採点・履歴・印刷は動き、AIを偽装した表示はしません。

## データとバックアップ

- DB: `data/hub.sqlite`
- 教材画像: `data/uploads/materials/`
- キャラクター画像: `data/uploads/characters/`
- 回答画像: `data/uploads/answers/`

設定画面からZIPを書き出せます。復元は既存データを自動上書きしません。

