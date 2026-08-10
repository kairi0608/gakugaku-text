import { GraduationCap, Presentation, UserRound } from "lucide-react";
import Link from "next/link";

const experiences = [
  { href: "/personal", title: "個人で使う", description: "自分に合った教材を作って、自分のペースで学習します。", action: "個人ページへ", icon: UserRound },
  { href: "/student", title: "生徒として使う", description: "先生からの課題や、自分の練習問題に取り組みます。", action: "生徒ページへ", icon: GraduationCap },
  { href: "/teacher", title: "教師として使う", description: "AI教材の作成、教材の確認、学習への活用を行います。", action: "教師ページへ", icon: Presentation },
] as const;

export default function ExperienceSelectPage() {
  return <main className="public-main role-select-page"><div className="role-select-intro"><p className="eyebrow">ガクガクAIシステム</p><h1>あなたの使い方を選んでください</h1><p>目的に合ったページから、教材作成や学習を始められます。</p></div><div className="role-select-grid">{experiences.map(({ href, title, description, action, icon: Icon }) => <Link className="role-select-card" href={href} key={href}><span className="role-select-icon"><Icon aria-hidden="true" size={24} /></span><h2>{title}</h2><p>{description}</p><span className="role-select-action">{action} →</span></Link>)}</div></main>;
}
