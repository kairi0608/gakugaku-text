import Link from "next/link";
import { AuthCard, AuthNotice } from "../AuthCard";
import { ResendConfirmationForm } from "./ResendConfirmationForm";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const query = await searchParams;
  return <AuthCard title="確認メールを送信しました" description="メール内のリンクを開くと登録が完了します。" footer={<p><Link href="/auth/login">ログインへ戻る</Link></p>}>
    <AuthNotice error={query.error} message={query.message} />
    <ul className="auth-check-list"><li>迷惑メール・プロモーションフォルダも確認してください。</li><li>到着まで数分かかる場合があります。</li><li>届かない場合は、下から安全に再送できます。</li></ul>
    <ResendConfirmationForm />
  </AuthCard>;
}

