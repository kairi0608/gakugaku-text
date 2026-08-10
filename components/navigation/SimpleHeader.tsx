import { BookOpenCheck } from "lucide-react";
import Link from "next/link";

export function SimpleHeader() {
  return <header className="simple-header"><Link className="brand" href="/" aria-label="ガクガクAIシステム"><span className="brand-mark"><BookOpenCheck aria-hidden="true" size={22} /></span><span>ガクガクAIシステム</span></Link><nav aria-label="公開ページナビゲーション"><Link href="/auth/login">ログイン</Link><Link href="/auth/signup">新規登録</Link><Link href="/privacy">プライバシー</Link><Link href="/terms">利用規約</Link></nav></header>;
}
