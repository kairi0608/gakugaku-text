import { BookOpenCheck, GraduationCap, Presentation, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";

const roles = [
  { title: "個人", description: "自分に合った教材を作り、自分のペースで学習します。", icon: UserRound },
  { title: "生徒", description: "先生からの課題や、自分の練習に取り組みます。", icon: GraduationCap },
  { title: "教師", description: "AIで教材を作り、クラスへの配布や提出確認を行います。", icon: Presentation },
] as const;

export default function LandingPage() {
  return <main className="public-main landing-page"><section className="landing-hero"><div><p className="eyebrow"><Sparkles size={15} />AIと育てる学び</p><h1>一人ひとりに、続けたくなる<span className="no-break">学習体験</span>を。</h1><p>教材作成から学習、振り返り、キャラクターの成長までをひとつにつなぎます。</p><div className="actions"><Link className="button" href="/auth/signup">無料で始める</Link><Link className="button outline" href="/auth/login">ログイン</Link></div></div><div className="hero-visual"><span className="brand-mark hero-mark"><BookOpenCheck size={48} /></span><strong>ガクガクAIシステム</strong><p>自分に合った教材で、今日の学びを始めましょう。</p></div></section><section className="role-select-grid landing-roles">{roles.map(({ title, description, icon: Icon }) => <article className="role-select-card" key={title}><span className="role-select-icon"><Icon size={24} /></span><h2>{title}</h2><p>{description}</p><Link className="button outline" href="/auth/signup">新規登録</Link></article>)}</section></main>;
}
