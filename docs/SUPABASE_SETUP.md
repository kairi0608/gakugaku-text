# Supabaseセットアップ

1. Supabaseで新しいプロジェクトを作成します。
2. SQL Editorを開き、`supabase/migrations/002_hub_cloud_schema.sql`の全文を実行します。
3. Project URL、anon key、service role keyを取得します。
4. ローカルとVercelへ環境変数を登録します。

`hub_`接頭辞の全テーブルでRLSが有効です。anon/authenticatedには直接権限を与えず、現段階ではサーバー専用クライアントだけがアクセスします。service role keyをGitHubへ保存したり、`NEXT_PUBLIC_`付きの変数へ入れたりしないでください。
