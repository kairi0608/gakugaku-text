# Supabaseセットアップ

1. Supabase Projectを作成します。
2. AuthenticationでEmail / Passwordを有効にします。
3. Project URL、anon key、service role keyを取得します。
4. `.env.local` とVercelへ環境変数を登録します。
5. `supabase/migrations/002_hub_cloud_schema.sql`、続いて `003_auth_roles_and_customization.sql` を適用します。
6. AuthenticationのSite URL / Redirect URLsへローカルと本番の `/auth/callback` を追加します。

003がProfiles、所有権、RLS、Private Storage bucket、クラス、課題、提出、AI生成ログを追加します。通常CRUDはanon keyを使うセッション付きサーバークライアントとRLSで行います。Service RoleをGitHubへ保存したり、`NEXT_PUBLIC_`付きの変数へ入れたりしないでください。

最初の管理者作成と既存データ方針は `AUTH_SETUP.md` と `RLS.md` を参照してください。
