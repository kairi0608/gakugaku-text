# Supabaseセットアップ

1. Supabase Projectを作成します。
2. **Authentication → Providers → Email** でEmail providerを有効化し、Confirm Emailを環境方針に合わせて設定します。
3. Project URL、anon key、service role keyを取得し、`.env.local` とVercelへ登録します。
4. `002_hub_cloud_schema.sql`、`003_auth_roles_and_customization.sql`、`004_auth_signup_roles_and_email_support.sql` の順に適用します。
5. **Authentication → URL Configuration** へSite URLとRedirect URLを登録します。

| 環境 | Site URL | Redirect URL |
| --- | --- | --- |
| 開発 | `http://localhost:3000` | `http://localhost:3000/auth/callback` |
| 本番 | 実際のProduction URL | `https://<production-domain>/auth/callback` |
| Preview（使用時） | 対象Preview URL | 対象Preview URLの `/auth/callback` |

003がProfiles、所有権、RLS、Private Storage bucket、クラス、課題、提出、AI生成ログを追加します。004は公開登録ロールへ教師を安全に追加し、管理者や不正なmetadataを `personal` に戻します。通常CRUDはanon keyを使うセッション付きサーバークライアントとRLSで行います。Service RoleをGitHubへ保存したり、`NEXT_PUBLIC_` 付きの変数へ入れたりしないでください。

メール未達時は **Authentication → Users** と **Authentication → Logs** を最初に確認します。ProductionではCustom SMTPを推奨します。詳細な確認順、SMTP設定、最初の管理者作成は [AUTH_SETUP.md](./AUTH_SETUP.md) を参照してください。

