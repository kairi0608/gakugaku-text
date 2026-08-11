import Link from "next/link";
import { AuthCard, AuthNotice } from "../AuthCard";
import { ResendConfirmationForm } from "./ResendConfirmationForm";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const query = await searchParams;
  return <AuthCard title="メールを確認してください" description="登録したメールアドレスに確認リンクを送信しました。" footer={<p><Link href="/auth/login">ログインへ戻る</Link></p>}>
    <AuthNotice error={query.error} message={query.message} />
    <ul className="auth-check-list"><li>迷惑メールフォルダを確認する</li><li>数分待ってから受信箱を更新する</li><li>届かない場合は確認メールを再送する</li></ul>
    <ResendConfirmationForm />
  </AuthCard>;
}
