# ガクガクAIシステム

AI教材の作成、学習、採点、履歴、学習パートナーを管理するNext.jsアプリです。本番データはSupabase PostgreSQLへ保存し、Vercelの一時ファイル領域には依存しません。

入口の`/`から個人・生徒・教師の利用ページを選択できます。`/personal`、`/student`、`/teacher`は現段階ではUI上の利用モードであり、認証済みroleではありません。Auth・RLS移行計画は`docs/ROLE_AUTH_MIGRATION.md`を参照してください。

## セットアップ

1. `pnpm install --frozen-lockfile`
2. `.env.example`を`.env.local`へコピーしてSupabase情報を設定
3. Supabase SQL Editorで`supabase/migrations/002_hub_cloud_schema.sql`を実行
4. `pnpm dev`

## 必須環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`はサーバー専用で、ブラウザへ公開しません。OpenAI機能を使う場合だけ`OPENAI_API_KEY`、`OPENAI_TEXT_MODEL`、`OPENAI_IMAGE_MODEL`も設定します。

## 品質確認

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

VercelではRoot Directoryを`.`、Install Commandを`pnpm install --frozen-lockfile`、Build Commandを`pnpm build`に設定します。
