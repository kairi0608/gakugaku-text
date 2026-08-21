import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { withExperienceRole } from "@/config/navigation";
import { listMaterials } from "@/lib/materials";
import { requireAnyRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { draft: "要確認", reviewing: "確認中", approved: "承認済み", published: "配布済み", archived: "終了" };

export default async function MaterialsPage() {
  const { profile: { role } } = await requireAnyRole(["personal", "student", "teacher"]);
  let loadError = false;
  const materials = await listMaterials().catch(() => { loadError = true; return []; });
  const title = role === "teacher" ? "教材管理" : role === "student" ? "課題・自主学習" : "教材一覧";
  const description = role === "teacher" ? "作成した教材の内容と状態を確認できます。" : "取り組む教材を選んで、学習を始められます。";
  const createLabel = role === "student" ? "自分で練習を作る" : "新しい教材";
  return (
    <main className="shell">
      <PageHeader eyebrow={role === "teacher" ? "教師ページ" : role === "student" ? "生徒ページ" : "個人ページ"} title={title} description={description} action={<Link className="button" href={withExperienceRole("/create", role)}><Plus aria-hidden="true" size={18} />{createLabel}</Link>} />
      {loadError && <p className="notice error">教材を読み込めませんでした。設定画面でSupabaseの接続情報を確認してください。</p>}
      {materials.length ? <div className="material-list">{materials.map(material => <Link className="material-row" href={role === "teacher" || role === "admin" ? `/teacher/materials/${material.id}/review` : withExperienceRole(`/materials/${material.id}`, role)} key={material.id}><span className="material-icon"><BookOpen aria-hidden="true" size={20} /></span><div><h2>{material.title}</h2><p>更新: {new Date(material.updatedAt).toLocaleString("ja-JP")}</p></div><StatusBadge tone={["approved", "published"].includes(material.status) ? "success" : material.status === "draft" ? "warning" : "default"}>{statusLabels[material.status] ?? material.status}</StatusBadge><span className="row-date">内容を見る</span></Link>)}</div> : !loadError && <EmptyState title="教材がまだありません" description="学年・教科・単元を選んで、最初の教材を作りましょう。" action={<Link className="button" href={withExperienceRole("/create", role)}>教材を作る</Link>} />}
    </main>
  );
}
