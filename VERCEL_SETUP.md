# Vercel セットアップ

GitHub リポジトリを Import し、次の値を設定します。

- Root Directory: `.`
- Framework Preset: `Next.js`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: 空欄

Production / Preview の Environment Variables には次を登録します。

```text
NEXT_PUBLIC_APP_URL=https://実際のVercelドメイン
NEXT_PUBLIC_SUPABASE_URL=https://プロジェクトID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabaseのanon key
SUPABASE_SERVICE_ROLE_KEY=Supabaseのservice role key
OPENAI_API_KEY=OpenAIのAPI key
OPENAI_TEXT_MODEL=gpt-5-mini
OPENAI_IMAGE_MODEL=gpt-image-1.5
```

`SUPABASE_SERVICE_ROLE_KEY` と `OPENAI_API_KEY` は `NEXT_PUBLIC_` を付けず、サーバー専用にします。値を変更したら Redeploy が必要です。

## 初回デプロイ前

1. Supabase SQL Editor で `002_hub_cloud_schema.sql`、`003_auth_roles_and_customization.sql`、`004_auth_signup_roles_and_email_support.sql` の順に適用します。
2. Supabase Auth の Site URL を本番URLにします。
3. Redirect URLs に `https://実際のVercelドメイン/auth/callback` を登録します。
4. Storage の `gakugaku-assets` が private であることを確認します。
5. 最初の管理者は、対象ユーザー作成後に SQL Editor で `profiles.role = 'admin'` を設定します。通常の登録画面から管理者は作成できません。教師は登録できます。

詳細は [AUTH_SETUP.md](./AUTH_SETUP.md)、[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)、[AI_GENERATION.md](./AI_GENERATION.md) を参照してください。
