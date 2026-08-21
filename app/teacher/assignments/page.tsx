import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { AssignmentForm } from "@/components/workflows/AssignmentForm";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function TeacherAssignmentsPage() {
  await requireRole("teacher");
  const db = await createClient();
  const [classroomsResult, materialsResult, assignmentsResult] = await Promise.all([
    db.from("hub_classrooms").select("id,name").order("name"),
    db.from("hub_materials").select("id,title,current_version_id,status").in("status", ["approved", "published"]).not("current_version_id", "is", null).order("updated_at", { ascending: false }),
    db.from("hub_assignments").select("id,title,due_at,published_at,created_at").order("created_at", { ascending: false }),
  ]);
  if (classroomsResult.error || materialsResult.error || assignmentsResult.error) throw new Error("課題データを取得できませんでした。");
  const classrooms = (classroomsResult.data ?? []).map(item => ({ id: item.id, label: item.name }));
  const versions = (materialsResult.data ?? []).filter(item => item.current_version_id).map(item => ({ id: String(item.current_version_id), label: item.title }));
  return <main className="shell"><PageHeader eyebrow="教師ページ" title="課題" description="教師が確認・承認した教材の特定バージョンだけをクラスへ配布します。" /><AppCard><h2>課題を作成</h2>{versions.length ? <AssignmentForm classrooms={classrooms} versions={versions} /> : <EmptyState title="承認済み教材がありません" description="教材管理で内容を確認し、承認してから課題を作成してください。" />}</AppCard><section className="section-gap"><h2>作成した課題</h2>{assignmentsResult.data?.length ? <div className="material-list">{assignmentsResult.data.map(item => <article className="material-row" key={item.id}><div><h2>{item.title}</h2><p>{item.due_at ? `締切 ${new Date(item.due_at).toLocaleString("ja-JP")}` : "締切なし"}</p></div><StatusBadge tone={item.published_at ? "success" : "warning"}>{item.published_at ? "公開中" : "下書き"}</StatusBadge></article>)}</div> : <EmptyState title="課題はまだありません" description="クラスと教材を選び、最初の課題を作成してください。" />}</section></main>;
}
