import Link from "next/link";
import { AuthCard, AuthNotice } from "../AuthCard";
import { loginAction } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  const query = await searchParams;
  return <AuthCard title="ログイン" description="学習データや教材を安全に引き継いで利用できます。" footer={<p>アカウントをお持ちでない方は <Link href="/auth/signup">新規登録</Link></p>}>
    <AuthNotice error={query.error} message={query.message} />
    <form action={loginAction} className="auth-form">
      <input type="hidden" name="next" value={query.next ?? ""} />
      <label className="field"><span className="field-label">メールアドレス</span><input name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span className="field-label">パスワード</span><input name="password" type="password" autoComplete="current-password" required /></label>
      <div className="auth-actions"><Link href="/auth/forgot-password">パスワードを忘れた方</Link></div>
      <button className="button auth-submit" type="submit">ログイン</button>
    </form>
  </AuthCard>;
}
