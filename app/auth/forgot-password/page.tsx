import Link from "next/link";
import { AuthCard, AuthNotice } from "../AuthCard";
import { AuthSubmitButton } from "../AuthSubmitButton";
import { forgotPasswordAction } from "../actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <AuthCard title="パスワードを再設定" description="登録メールアドレスへ安全な再設定リンクを送信します。" footer={<Link href="/auth/login">ログインへ戻る</Link>}>
    <AuthNotice error={query.error} />
    <form action={forgotPasswordAction} className="auth-form"><label className="field"><span className="field-label">メールアドレス</span><input name="email" type="email" autoComplete="email" required /></label><AuthSubmitButton idleLabel="再設定メールを送る" pendingLabel="送信中…" /></form>
  </AuthCard>;
}
