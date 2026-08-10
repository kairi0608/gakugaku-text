# ローカルセットアップ

`.env.example` を `.env.local` へコピーし、Supabase公開キー、サーバー専用Service Role、OpenAIキーとモデル名を設定します。Supabaseへ002、003、004 migrationを順番に適用後、`pnpm install --frozen-lockfile` と `pnpm dev` を実行します。

AuthのRedirect URLには `http://localhost:3000/auth/callback` が必要です。実AI・メール・Storage・RLS E2Eは検証用Supabase/OpenAI Projectで行い、本番データを使わないでください。
