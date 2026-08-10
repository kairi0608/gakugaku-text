# 認証セットアップ

## 1. Supabase Auth

Supabase Dashboard の Authentication で Email / Password を有効にします。Site URL は本番URL、Redirect URLs には次を登録します。

- `http://localhost:3000/auth/callback`
- `https://<your-domain>/auth/callback`

メール確認を有効にする場合、登録後は確認メールを経由して `/auth/callback` でセッションを確立します。パスワード再設定も同じコールバックを経由し、`/auth/reset-password` へ戻ります。

## 2. 環境変数

`.env.example` を `.env.local` にコピーし、Supabase Project Settings の値を設定します。`SUPABASE_SERVICE_ROLE_KEY` と `OPENAI_API_KEY` はサーバー専用です。`NEXT_PUBLIC_` を付けたり、クライアントコードへ渡したりしないでください。

Vercel では Production / Preview / Development の必要な環境へ同じ変数名を登録し、登録後に再デプロイします。

## 3. Migration

`002_hub_cloud_schema.sql` を適用済みであることを確認してから、`003_auth_roles_and_customization.sql` をSQL EditorまたはSupabase CLIで適用します。003は既存テーブルを削除せず、所有者列、認証プロフィール、RLS、Storage、クラス関連テーブルを追加します。

既存のAuthユーザーには `personal` プロフィールが安全に補完されます。既存の教材・履歴・キャラクターで所有者が不明な行は自動で誰かへ割り当てません。必要なら監査後に管理者が個別に移行してください。

## 4. 最初の管理者

最初の1人だけは、信頼できるSQL Editorで対象メールを確認してから設定します。

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = (select id from auth.users where email = 'admin@example.com');
```

以後、教師・管理者ロールは `/admin/users` から管理者が割り当てます。新規登録画面で選べるのは `personal` と `student` だけです。

## 5. 確認項目

1. 個人・生徒の新規登録、メール確認、ログイン、ログアウトを確認する。
2. パスワード再設定メールから新しいパスワードを保存する。
3. 未ログインで保護ページへアクセスすると `/auth/login` へ移動することを確認する。
4. 異なるロールのルートへアクセスすると自分のDashboardへ戻ることを確認する。
