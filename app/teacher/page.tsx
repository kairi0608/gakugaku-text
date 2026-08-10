import { BookOpen, FilePlus2 } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { withExperienceRole } from "@/config/navigation";
import { listMaterials } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  let loadError = false;
  const materials = await listMaterials().catch(() => { loadError = true; return []; });
  const recentMaterials = materials.slice(0, 4);
  return <main className="shell teacher-dashboard"><PageHeader eyebrow="教師ページ" title="教材を作り、内容を確認する" description="AI教材の作成と、保存した教材の管理をひとつの場所で行います。" action={<Link className="button" href={withExperienceRole("/create", "teacher")}><FilePlus2 aria-hidden="true" size={18} />教材を作る</Link>} />{loadError && <p className="notice error">教材を読み込めませんでした。設定画面でSupabaseの接続情報を確認してください。</p>}
    <div className="teacher-grid"><AppCard className="teacher-stat-card"><span className="card-kicker">教材</span><div className="metric-value">{materials.length}<small> 件</small></div><p className="muted">現在保存されている教材</p><Link className="button outline" href={withExperienceRole("/materials", "teacher")}>教材を管理する</Link></AppCard><AppCard className="teacher-create-card"><span className="teacher-accent-icon"><FilePlus2 aria-hidden="true" size={24} /></span><h2>新しい教材を作成</h2><p className="muted">学年・教科・単元を指定して、問題と解説をまとめて作成します。</p><Link className="button" href={withExperienceRole("/create", "teacher")}>教材作成を始める</Link></AppCard></div>
    <AppCard><SectionHeader title="最近の教材" action={<Link className="section-link" href={withExperienceRole("/materials", "teacher")}>すべて見る</Link>} />{recentMaterials.length ? <div className="material-list">{recentMaterials.map(material => <Link className="material-row" href={withExperienceRole(`/materials/${material.id}`, "teacher")} key={material.id}><span className="material-icon"><BookOpen aria-hidden="true" size={19} /></span><div><h2>{material.title}</h2><p>{new Date(material.updatedAt).toLocaleString("ja-JP")} 更新</p></div><StatusBadge tone={material.status === "ready" ? "success" : "default"}>{material.status === "ready" ? "確認可能" : material.status}</StatusBadge><span className="row-date">内容を確認</span></Link>)}</div> : !loadError && <EmptyState title="教材はまだありません" description="教材を作成すると、ここから内容を確認できます。" action={<Link className="button" href={withExperienceRole("/create", "teacher")}>最初の教材を作る</Link>} />}</AppCard>
  </main>;
}
