# ガクガクAIシステム

AI教材生成、学習・採点、AIフィードバック、キャラクター成長、背景カスタマイズ、教師・生徒のクラス課題を統合したNext.js / Supabaseアプリです。

## 技術構成

- Next.js 15 App Router / React 19 / TypeScript
- Supabase Auth、Postgres RLS、Private Storage
- OpenAI Responses API structured output / Images API
- Zod、sharp、Vitest、ESLint

## ローカル起動

```bash
pnpm install --frozen-lockfile
copy .env.example .env.local
pnpm dev
```

環境変数を設定し、Supabaseへ `002_hub_cloud_schema.sql`、続いて `003_auth_roles_and_customization.sql` を適用してください。詳しくは [AUTH_SETUP](docs/AUTH_SETUP.md) と [SUPABASE_SETUP](docs/SUPABASE_SETUP.md) を参照してください。

## 必須環境変数

```text
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=
OPENAI_IMAGE_MODEL=
```

Service RoleとOpenAIキーはサーバー専用です。クライアントへ公開しません。

## 品質ゲート

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit --pretty false
pnpm lint
pnpm test
pnpm build
```

## ドキュメント

- [認証セットアップ](docs/AUTH_SETUP.md)
- [ロールモデル](docs/ROLE_MODEL.md)
- [RLSと所有権](docs/RLS.md)
- [AI生成](docs/AI_GENERATION.md)
- [キャラクター成長](docs/CHARACTER_GROWTH.md)
- [背景カスタマイズ](docs/BACKGROUND_CUSTOMIZATION.md)
- [教師・生徒フロー](docs/TEACHER_STUDENT_FLOW.md)
- [Vercel設定](docs/VERCEL_SETUP.md)

## デプロイ前確認

Vercelの環境変数、SupabaseのSite URL / Redirect URL、003 migration、最初の管理者ロールを確認します。実サービスを使うE2E（登録メール、AI生成、Private Storage、RLSの複数ユーザー分離）は、Productionとは別の検証Supabase/OpenAI環境で実施してから公開してください。
