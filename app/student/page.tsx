import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { withExperienceRole } from "@/config/navigation";
import { studentExperience, type StudentStage } from "@/config/student-experience";
import { getAttemptHistory, listCharacters } from "@/lib/materials";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getCurrentAssignment() {
  const db = await createClient();
  const { data: assignment, error } = await db.from("hub_assignments").select("id,title,due_at,material_version_id").not("published_at", "is", null).order("due_at", { ascending: true, nullsFirst: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!assignment) return null;
  const { data: version, error: versionError } = await db.from("hub_material_versions").select("material_id").eq("id", assignment.material_version_id).single();
  if (versionError) throw versionError;
  return { ...assignment, materialId: version.material_id };
}

export default async function StudentDashboard() {
  const current = await requireRole("student");
  let dataIssue = false;
  const [assignment, attempts, characters] = await Promise.all([
    getCurrentAssignment().catch(() => { dataIssue = true; return null; }),
    getAttemptHistory().catch(() => { dataIssue = true; return []; }),
    listCharacters().catch(() => { dataIssue = true; return []; }),
  ]);
  const inProgress = attempts.find(attempt => attempt.status !== "completed" && attempt.materialId);
  const recentResults = attempts.filter(attempt => attempt.status === "completed").slice(0, 3);
  const character = characters[0];
  const gradeBand = current.profile.gradeBand;
  const stageKey: StudentStage = gradeBand === "elementary" || gradeBand === "high" ? gradeBand : "middle";
  const stage = studentExperience[stageKey];
  const expProgress = character ? character.exp % 100 : 0;

  return <main className="shell student-dashboard"><PageHeader eyebrow={`生徒ページ・${stage.label}`} title="課題を見つけ、解き、結果を見る" description="取り組める教材を選んで、1問ずつ進めましょう。" />{dataIssue && <p className="notice error">学習データを読み込めませんでした。設定画面で接続情報を確認してください。</p>}
    <div className="student-primary-grid"><AppCard className="student-task-card"><span className="card-kicker">今日の課題</span>{assignment ? <><div className="student-task-summary"><span className="row-icon"><BookOpen aria-hidden="true" size={19} /></span><div><StatusBadge tone="success">取り組めます</StatusBadge><h2>{assignment.title}</h2><p>{assignment.due_at ? `締切: ${new Date(assignment.due_at).toLocaleDateString("ja-JP")}` : "締切なし"}</p></div></div><Link className="button student-primary-action" href={withExperienceRole(`/learn/${assignment.materialId}?assignment=${assignment.id}`, "student")}><GraduationCap aria-hidden="true" size={19} />課題を始める</Link></> : <EmptyState title="取り組める課題はありません" description="クラスに参加するか、先生からの課題公開を待ちましょう。" action={<Link className="button secondary" href="/student/assignments">課題一覧を見る</Link>} />}</AppCard>
      <AppCard><SectionHeader title="学習を続ける" />{inProgress ? <Link className="recent-row" href={withExperienceRole(`/learn/${inProgress.materialId}`, "student")}><span className="row-icon"><GraduationCap aria-hidden="true" size={17} /></span><span className="row-title">{inProgress.materialTitle ?? "学習中の教材"}<span className="row-meta">前回の続きから取り組む</span></span><span className="row-value">続ける →</span></Link> : <EmptyState title="途中の学習はありません" description="課題を始めると、続きから取り組めます。" />}<Link className="button secondary" href={withExperienceRole("/create", "student")}>自分で練習を作る</Link></AppCard></div>
    <div className="dashboard-lower"><AppCard><SectionHeader title="最近の結果" action={<Link className="section-link" href={withExperienceRole("/history", "student")}>履歴を見る</Link>} />{recentResults.length ? <div className="recent-list">{recentResults.map(result => <div className="recent-row" key={result.id}><span className="row-icon"><BookOpen aria-hidden="true" size={17} /></span><span className="row-title">{result.materialTitle ?? "教材"}<span className="row-meta">{new Date(result.startedAt).toLocaleDateString("ja-JP")}</span></span><strong className="row-value">{result.score ?? "—"}点</strong></div>)}</div> : <EmptyState title="結果はまだありません" description="回答を提出すると得点が表示されます。" />}</AppCard>
      <AppCard className="student-character-card"><SectionHeader title="キャラクター" />{character ? <div className="character-summary"><div className="character-avatar"><Sparkles aria-hidden="true" /></div><div><h3>Lv.{character.level} {character.name}</h3><p>EXP {character.exp}</p><div className="progress-track" aria-label={`経験値 ${expProgress}%`}><div className="progress-fill" style={{ width: `${expProgress}%` }} /></div></div></div> : <EmptyState title="キャラクターがまだいません" description="学習パートナーを作ると、学習と一緒に成長します。" action={<Link className="button secondary" href={withExperienceRole("/characters/new", "student")}>作る</Link>} />}</AppCard></div>
  </main>;
}
