import { BookOpenCheck, GraduationCap, Presentation, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";

const roles = [
  { title: "個人", description: "AI教材を作り、自分のペースで学習・振り返り・キャラクター育成を進めます。", icon: UserRound },
  { title: "生徒", description: "先生のクラスへ参加し、配布課題と自主学習を一つの履歴にまとめます。", icon: GraduationCap },
  { title: "教師", description: "教材生成、クラス、課題、提出確認を安全な権限分離のもとで管理します。", icon: Presentation },
] as const;

export default function LandingPage() {
  return <main className="public-main landing-page"><section className="landing-hero"><div><p className="eyebrow"><Sparkles size={15} />AIと育てる学び</p><h1>一人ひとりに、<br />続けたくなる学習体験を。</h1><p>ガクガクAIシステムは、教材作成・学習・振り返り・キャラクター成長・クラス課題をつなぐ学習プラットフォームです。</p><div className="actions"><Link className="button" href="/auth/signup">無料で始める</Link><Link className="button outline" href="/auth/login">ログイン</Link></div></div><div className="hero-visual"><span className="brand-mark hero-mark"><BookOpenCheck size={48} /></span><strong>ガクガクAIシステム</strong><p>安全なアカウントとロール別画面で、必要な機能だけにアクセスできます。</p></div></section><section className="role-select-grid landing-roles">{roles.map(({ title, description, icon: Icon }) => <article className="role-select-card" key={title}><span className="role-select-icon"><Icon size={24} /></span><h2>{title}</h2><p>{description}</p></article>)}</section></main>;
}
