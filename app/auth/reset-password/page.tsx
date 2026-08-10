import { AuthCard, AuthNotice } from "../AuthCard";
import { resetPasswordAction } from "../actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <AuthCard title="新しいパスワード" description="新しいパスワードを2回入力してください。"><AuthNotice error={query.error} /><form action={resetPasswordAction} className="auth-form"><label className="field"><span className="field-label">新しいパスワード</span><input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /></label><label className="field"><span className="field-label">新しいパスワード（確認）</span><input name="passwordConfirmation" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /></label><button className="button auth-submit" type="submit">パスワードを更新</button></form></AuthCard>;
}
