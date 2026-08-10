import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { withExperienceRole } from "@/config/navigation";
import { defaultStudentStage, studentExperience } from "@/config/student-experience";
import { getAttemptHistory, listCharacters, listMaterials } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  let dataIssue = false;
  const [materials, attempts, characters] = await Promise.all([
    listMaterials().catch(() => { dataIssue = true; return []; }),
    getAttemptHistory().catch(() => { dataIssue = true; return []; }),
    listCharacters().catch(() => { dataIssue = true; return []; }),
  ]);
  const currentMaterial = materials[0];
  const inProgress = attempts.find(attempt => attempt.status !== "completed" && attempt.materialId);
  const recentResults = attempts.filter(attempt => attempt.status === "completed").slice(0, 3);
  const character = characters[0];
  const stage = studentExperience[defaultStudentStage];
  const expProgress = character ? character.exp % 100 : 0;

  return <main className="shell student-dashboard"><PageHeader eyebrow={`生徒ページ・${stage.label}`} title="課題を見つけ、解き、結果を見る" description="取り組める教材を選んで、1問ずつ進めましょう。" />{dataIssue && <p className="notice error">学習データを読み込めませんでした。設定画面で接続情報を確認してください。</p>}
    <div className="student-primary-grid"><AppCard className="student-task-card"><span className="card-kicker">今日の課題</span>{currentMaterial ? <><div className="student-task-summary"><span className="row-icon"><BookOpen aria-hidden="true" size={19} /></span><div><StatusBadge tone="success">取り組めます</StatusBadge><h2>{currentMaterial.title}</h2><p>更新: {new Date(currentMaterial.updatedAt).toLocaleDateString("ja-JP")}</p></div></div><Link className="button student-primary-action" href={withExperienceRole(`/learn/${currentMaterial.id}`, "student")}><GraduationCap aria-hidden="true" size={19} />課題を始める</Link></> : <EmptyState title="取り組める課題はありません" description="新しい教材が追加されると、ここに表示されます。" />}</AppCard>
      <AppCard><SectionHeader title="学習を続ける" />{inProgress ? <Link className="recent-row" href={withExperienceRole(`/learn/${inProgress.materialId}`, "student")}><span className="row-icon"><GraduationCap aria-hidden="true" size={17} /></span><span className="row-title">{inProgress.materialTitle ?? "学習中の教材"}<span className="row-meta">前回の続きから取り組む</span></span><span className="row-value">続ける →</span></Link> : <EmptyState title="途中の学習はありません" description="課題を始めると、続きから取り組めます。" />}<Link className="button secondary" href={withExperienceRole("/create", "student")}>自分で練習を作る</Link></AppCard></div>
    <div className="dashboard-lower"><AppCard><SectionHeader title="最近の結果" action={<Link className="section-link" href={withExperienceRole("/history", "student")}>履歴を見る</Link>} />{recentResults.length ? <div className="recent-list">{recentResults.map(result => <div className="recent-row" key={result.id}><span className="row-icon"><BookOpen aria-hidden="true" size={17} /></span><span className="row-title">{result.materialTitle ?? "教材"}<span className="row-meta">{new Date(result.startedAt).toLocaleDateString("ja-JP")}</span></span><strong className="row-value">{result.score ?? "—"}点</strong></div>)}</div> : <EmptyState title="結果はまだありません" description="回答を提出すると得点が表示されます。" />}</AppCard>
      <AppCard className="student-character-card"><SectionHeader title="キャラクター" />{character ? <div className="character-summary"><div className="character-avatar"><Sparkles aria-hidden="true" /></div><div><h3>Lv.{character.level} {character.name}</h3><p>EXP {character.exp}</p><div className="progress-track" aria-label={`経験値 ${expProgress}%`}><div className="progress-fill" style={{ width: `${expProgress}%` }} /></div></div></div> : <EmptyState title="キャラクターがまだいません" description="学習パートナーを作ると、学習と一緒に成長します。" action={<Link className="button secondary" href={withExperienceRole("/characters/new", "student")}>作る</Link>} />}</AppCard></div>
  </main>;
}
