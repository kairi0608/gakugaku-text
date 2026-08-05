# Supabaseセットアップ

1. 新規プロジェクトを作成し、`001_initial_schema.sql`を適用します。
2. AuthのSite URLを本番URL、Redirect URLsへ`/auth/callback`と`/auth/reset-password`を追加します。
3. migrationが作成する`material-assets`と`submission-assets`がprivateであることを確認します。
4. 最初の管理者・教師はSQL Editorでservice role相当の管理操作として`profiles.role`を更新します。一般画面からは付与しません。
5. Project URL、anon key、service role keyを環境変数へ設定します。
