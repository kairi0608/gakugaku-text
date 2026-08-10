import { BookOpenCheck } from "lucide-react";
import Link from "next/link";

export function SimpleHeader() {
  return <header className="simple-header"><Link className="brand" href="/" aria-label="ガクガクAIシステム 利用方法選択"><span className="brand-mark"><BookOpenCheck aria-hidden="true" size={22} /></span><span>ガクガクAIシステム</span></Link><nav aria-label="公開ページナビゲーション"><Link href="/">利用方法を選ぶ</Link><Link href="/privacy">プライバシー</Link><Link href="/terms">利用規約</Link></nav></header>;
}
