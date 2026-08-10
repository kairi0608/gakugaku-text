import { BookOpen, ChevronRight, ClipboardCheck, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { withExperienceRole } from "@/config/navigation";
import { getAttemptHistory, listCharacters, listMaterials } from "@/lib/materials";

export const dynamic = "force-dynamic";
const stageLabels: Record<string, string> = { egg: "タマゴ", child: "こども", "learning-partner": "学習パートナー" };

export default async function PersonalDashboard() {
  let dataIssue = false;
  const [materials, attempts, characters] = await Promise.all([
    listMaterials().catch(() => { dataIssue = true; return []; }),
    getAttemptHistory().catch(() => { dataIssue = true; return []; }),
    listCharacters().catch(() => { dataIssue = true; return []; }),
  ]);
  const latestMaterial = materials[0];
  const recentAttempts = attempts.slice(0, 5);
  const completed = attempts.filter(attempt => attempt.status === "completed");
  const completedMaterials = new Set(completed.map(attempt => attempt.materialId).filter(Boolean)).size;
  const latestScore = completed.find(attempt => attempt.score !== null)?.score ?? null;
  const character = characters[0];
  const expProgress = character ? character.exp % 100 : 0;
  const reviewAttempt = completed.find(attempt => attempt.score !== null && attempt.score < 100 && attempt.materialId);
  const tasks = [
    latestMaterial ? { href: withExperienceRole(`/learn/${latestMaterial.id}`, "personal"), title: latestMaterial.title, detail: "最新の教材で学習する", label: "学習へ" } : null,
    reviewAttempt ? { href: withExperienceRole(`/learn/${reviewAttempt.materialId}`, "personal"), title: reviewAttempt.materialTitle ?? "前回の教材", detail: `${reviewAttempt.score}点だった教材を復習する`, label: "復習" } : null,
    !character ? { href: withExperienceRole("/characters/new", "personal"), title: "学習パートナーを作る", detail: "キャラクターと一緒に成長を記録する", label: "作成" } : null,
  ].filter((task): task is NonNullable<typeof task> => task !== null).slice(0, 3);

  return <main className="shell"><header className="page-header"><div><p className="eyebrow">個人ページ</p><h1>自分で作る・自分で学ぶ</h1><p className="page-description">今日の学習から振り返りまで、自分のペースで進めましょう。</p></div><div className="page-action"><Link className="button" href={withExperienceRole("/create", "personal")}>教材を作る</Link></div></header>{dataIssue && <p className="notice error">保存データを読み込めませんでした。設定画面でSupabaseの接続情報を確認してください。</p>}
    <div className="dashboard-grid"><AppCard className="dashboard-card"><span className="card-kicker">今日の学習</span>{latestMaterial ? <><div className="today-summary"><div><StatusBadge>現在の教材</StatusBadge><h2>{latestMaterial.title}</h2><p>{new Date(latestMaterial.updatedAt).toLocaleDateString("ja-JP")} 更新</p></div><div className="learning-illustration"><BookOpen aria-hidden="true" /></div></div><Link className="button" href={withExperienceRole(`/learn/${latestMaterial.id}`, "personal")}><GraduationCap aria-hidden="true" size={18} />学習を始める</Link></> : <EmptyState title="教材がまだありません" description="最初の教材を作ると、ここからすぐ学習を始められます。" action={<Link className="button" href={withExperienceRole("/create", "personal")}>教材を作る</Link>} />}</AppCard>
      <AppCard className="dashboard-card"><h2>学習の進捗</h2><p className="caption">これまでの学習記録</p><div className="metric-value">{attempts.length}<small> 回</small></div><div className="progress-track" aria-label={`完了した学習 ${completed.length}件`}><div className="progress-fill" style={{ width: `${attempts.length ? Math.round(completed.length / attempts.length * 100) : 0}%` }} /></div><div className="stats-mini"><div><strong>{latestScore === null ? "—" : `${latestScore}点`}</strong><span>直近の得点</span></div><div><strong>{completedMaterials}</strong><span>学習した教材</span></div></div><Link className="button outline" href={withExperienceRole("/history", "personal")}>詳細を見る</Link></AppCard>
      <AppCard className="dashboard-card"><h2>キャラクターの成長</h2>{character ? <><div className="character-summary"><div className="character-avatar"><Sparkles aria-hidden="true" /></div><div><h3>Lv.{character.level} {character.name}</h3><p>{stageLabels[character.stage] ?? character.stage}</p><div className="progress-track" aria-label={`経験値 ${expProgress}%`}><div className="progress-fill" style={{ width: `${expProgress}%` }} /></div></div></div><p className="caption">次のレベルまで あと {100 - expProgress} EXP</p><Link className="button outline" href={withExperienceRole("/characters", "personal")}>成長を見る</Link></> : <EmptyState title="キャラクターはいません" description="学習パートナーを作ると、学習に合わせて成長します。" action={<Link className="button secondary" href={withExperienceRole("/characters/new", "personal")}>新しく作る</Link>} />}</AppCard></div>
    <div className="dashboard-lower"><AppCard><SectionHeader title="やることリスト" />{tasks.length ? <div className="task-list">{tasks.map(task => <Link className="task-row" href={task.href} key={`${task.href}-${task.title}`}><span className="row-icon"><ClipboardCheck aria-hidden="true" size={17} /></span><span className="row-title">{task.title}<span className="row-meta">{task.detail}</span></span><span className="row-value">{task.label} <ChevronRight aria-hidden="true" size={14} /></span></Link>)}</div> : <EmptyState title="今日の項目は完了です" description="新しい教材を作るか、これまでの履歴を振り返りましょう。" />}</AppCard><AppCard><SectionHeader title="最近の学習" action={<Link className="section-link" href={withExperienceRole("/history", "personal")}>すべて見る</Link>} />{recentAttempts.length ? <div className="recent-list">{recentAttempts.map(attempt => <div className="recent-row" key={attempt.id}><span className="row-icon"><BookOpen aria-hidden="true" size={17} /></span><span className="row-title">{attempt.materialTitle ?? "教材"}<span className="row-meta">{new Date(attempt.startedAt).toLocaleString("ja-JP")}</span></span><span className="row-value">{attempt.score === null ? "学習中" : `${attempt.score}点`}</span></div>)}</div> : <EmptyState title="学習履歴はまだありません" description="教材で学習すると、得点と日時がここに表示されます。" />}</AppCard></div>
  </main>;
}
