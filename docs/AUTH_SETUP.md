# 認証セットアップ

## 1. Supabase Auth

Supabase Dashboard の **Authentication → Providers → Email** を開き、Email provider が有効であることを確認します。確認メールを使う環境では **Confirm Email** を有効にします。開発時に Confirm Email を無効化した場合は、`signUp` がセッションを返すため、アプリはそのままDB上のロール別Dashboardへ移動します。アプリから確認済み状態を強制する処理はありません。

## 2. URL Configuration

**Authentication → URL Configuration** で次を登録します。

- 開発 Site URL: `http://localhost:3000`
- 本番 Site URL: 実際に公開するProduction URL（例 `https://example.com`）
- 開発 Redirect URL: `http://localhost:3000/auth/callback`
- 本番 Redirect URL: `https://<production-domain>/auth/callback`
- Previewで認証を試す場合: 対象Preview URLの `/auth/callback`

Vercel の `NEXT_PUBLIC_APP_URL` には、メールリンクを最終的に戻したい環境のオリジンを末尾スラッシュなしで設定します。本番で未設定または不正なURLの場合、アプリはlocalhostへフォールバックせず設定エラーにします。

## 3. 環境変数

`.env.example` を `.env.local` にコピーし、Supabase Project Settings の値を設定します。`SUPABASE_SERVICE_ROLE_KEY` と `OPENAI_API_KEY` はサーバー専用です。`NEXT_PUBLIC_` を付けたり、クライアントコードへ渡したりしないでください。

Vercel では Production / Preview / Development の必要な環境へ同じ変数名を登録し、変更後に再デプロイします。Previewの `NEXT_PUBLIC_APP_URL` は、Supabase側で許可したPreview URLと一致させます。

## 4. Migration

SQL EditorまたはSupabase CLIで、次の順番に適用します。

1. `002_hub_cloud_schema.sql`
2. `003_auth_roles_and_customization.sql`
3. `004_auth_signup_roles_and_email_support.sql`

004は既存関数を `CREATE OR REPLACE FUNCTION` で更新し、公開登録で `personal` / `student` / `teacher` を許可します。`admin` や不正値は `personal` へ安全に戻します。既存プロフィールやAuthユーザーは削除しません。

## 5. 最初の管理者

最初の1人だけは、信頼できるSQL Editorで対象ユーザーを確認してから設定します。次のメールはダミーなので、実際の管理者メールへ置き換えてください。

```sql
update public.profiles
set role = 'admin',
    updated_at = now()
where id = (
  select id
  from auth.users
  where email = 'admin@example.com'
);
```

2人目以降は `/admin/users` から設定します。管理者は公開登録では選べません。既存のAPIは、ログイン中の管理者が自分自身の管理者権限を外す操作を拒否します。

## 6. 確認メールが届かない場合

コードが `signUp` 成功を返しても、メール配送完了とは限りません。次の順番で確認します。

1. **Authentication → Users** に対象ユーザーが作成されているか
2. **Authentication → Logs**（Auth Logs）で対象時刻のsignup・メール送信エラーとerror codeを確認
3. **Authentication → Providers → Email** でEmail providerが有効か
4. Confirm Emailの設定が意図した値か
5. Site URLが実際の開発・本番URLか
6. Redirect URLsに利用環境の `/auth/callback` があるか
7. 迷惑メール・Junk・プロモーションフォルダに入っていないか
8. Supabase built-in email providerの送信回数制限に達していないか（429時は時間を置く）
9. ProductionではCustom SMTPを設定し、そのSMTP事業者側の配信ログ・抑止リスト・ドメイン認証を確認

アプリのサーバーログには `signup` / `resend_signup` / `password_reset_email` / `callback_exchange` の処理名と安全なerror code・statusだけを記録します。パスワード、メール確認コード、access token、refresh token、API keyは記録しません。

## 7. Custom SMTP

ProductionではSupabaseの **Authentication → Email / SMTP settings** からCustom SMTPを使うことを推奨します。Sender domain、From address、SMTP host、port、username、passwordはSupabase Dashboard側へ設定します。値そのものを `.env.example`、ソースコード、GitHubへ保存しないでください。SPF・DKIMなどの送信ドメイン認証と、SMTP事業者側の配信ログも確認します。

## 8. 動作確認

1. 新しい未使用メールで個人・生徒・教師をそれぞれ登録する。
2. Confirm Email有効時は `/auth/check-email` に移動し、受信メールのリンクを開く。
3. callback後、`profiles.role` が `personal` / `student` / `teacher` になり、対応Dashboardへ移動することを確認する。
4. 再送、パスワード再設定、ログイン、ログアウトを確認する。
5. 教師が `/personal`、`/student`、`/admin` に入れず、管理者以外が `/admin` に入れないことを確認する。
6. 管理者で `/admin`、`/admin/users`、`/admin/generations`、`/admin/system` を確認する。

