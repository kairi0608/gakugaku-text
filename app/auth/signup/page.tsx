import Link from "next/link";
import { AuthCard, AuthNotice } from "../AuthCard";
import { signupAction } from "../actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <AuthCard title="新規登録" description="個人利用または生徒として学習を始めます。教師・管理者アカウントは管理者が発行します。" footer={<p>登録済みの方は <Link href="/auth/login">ログイン</Link></p>}>
    <AuthNotice error={query.error} />
    <form action={signupAction} className="auth-form">
      <label className="field"><span className="field-label">表示名</span><input name="displayName" autoComplete="name" maxLength={80} required /></label>
      <label className="field"><span className="field-label">メールアドレス</span><input name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span className="field-label">パスワード（8文字以上）</span><input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /></label>
      <label className="field"><span className="field-label">利用方法</span><select name="role" defaultValue="personal" required><option value="personal">個人で利用</option><option value="student">生徒として利用</option></select></label>
      <label className="field"><span className="field-label">学年区分（生徒の場合）</span><select name="gradeBand" defaultValue="other"><option value="elementary">小学生</option><option value="middle">中学生</option><option value="high">高校生</option><option value="other">その他</option></select></label>
      <p className="auth-consent">登録すると、<Link href="/terms">利用規約</Link>と<Link href="/privacy">プライバシーポリシー</Link>を確認したものとして扱われます。</p>
      <button className="button auth-submit" type="submit">アカウントを作成</button>
    </form>
  </AuthCard>;
}
