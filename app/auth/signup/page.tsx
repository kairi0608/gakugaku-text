import Link from "next/link";
import { AuthCard, AuthNotice } from "../AuthCard";
import { SignupForm } from "./SignupForm";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return <AuthCard title="新規登録" description="個人・生徒・教師として登録できます。管理者権限は既存の管理者のみが付与できます。" footer={<p>登録済みの方は <Link href="/auth/login">ログイン</Link></p>}>
    <AuthNotice error={query.error} />
    <SignupForm />
  </AuthCard>;
}
