import { BookOpenCheck, GraduationCap, Presentation, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";

const roles = [
  { title: "個人", description: "AI教材を作り、自分のペースで学習・振り返り・キャラクター育成を進めます。", icon: UserRound, href: "/auth/signup", action: "新規登録" },
  { title: "生徒", description: "先生のクラスへ参加し、配布課題と自主学習を一つの履歴にまとめます。", icon: GraduationCap, href: "/auth/signup", action: "新規登録" },
  { title: "教師", description: "教材生成、クラス、課題、提出確認を安全な権限分離のもとで管理します。", icon: Presentation, href: "/auth/signup", action: "新規登録" },
  { title: "管理者", description: "ユーザー、ロール、生成状況、システム状態を管理します。管理者登録は既存管理者が行います。", icon: ShieldCheck, href: "/auth/login", action: "管理者としてログイン" },
] as const;

export default function LandingPage() {
  return <main className="public-main landing-page"><section className="landing-hero"><div><p className="eyebrow"><Sparkles size={15} />AIと育てる学び</p><h1>一人ひとりに、<br />続けたくなる学習体験を。</h1><p>ガクガクAIシステムは、教材作成・学習・振り返り・キャラクター成長・クラス課題をつなぐ学習プラットフォームです。</p><div className="actions"><Link className="button" href="/auth/signup">無料で始める</Link><Link className="button outline" href="/auth/login">ログイン</Link></div></div><div className="hero-visual"><span className="brand-mark hero-mark"><BookOpenCheck size={48} /></span><strong>ガクガクAIシステム</strong><p>安全なアカウントとロール別画面で、必要な機能だけにアクセスできます。</p></div></section><section className="role-select-grid landing-roles">{roles.map(({ title, description, icon: Icon, href, action }) => <article className="role-select-card" key={title}><span className="role-select-icon"><Icon size={24} /></span><h2>{title}</h2><p>{description}</p><Link className="button outline" href={href}>{action}</Link></article>)}</section></main>;
}
