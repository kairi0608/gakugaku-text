import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { JoinClassroomForm } from "@/components/workflows/ClassroomForms";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function StudentAssignmentsPage() {
  await requireRole("student");
  const db = await createClient();
  const { data, error } = await db.from("hub_assignments").select("id,title,instructions,due_at,material_version_id,classroom_id").not("published_at", "is", null).order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`課題を取得できませんでした: ${error.message}`);
  const versionIds = (data ?? []).map(item => item.material_version_id);
  const versions = versionIds.length ? await db.from("hub_material_versions").select("id,material_id").in("id", versionIds) : { data: [], error: null };
  const materialByVersion = new Map((versions.data ?? []).map(version => [version.id, version.material_id]));
  return <main className="shell"><PageHeader eyebrow="生徒ページ" title="今日の課題" description="クラスの課題を確認し、提出まで一つの画面で進められます。" /><AppCard><h2>クラスに参加</h2><JoinClassroomForm /></AppCard><section className="section-gap"><h2>公開中の課題</h2>{data?.length ? <div className="material-list">{data.map(item => { const materialId = materialByVersion.get(item.material_version_id); return <Link className="material-row" href={materialId ? `/learn/${materialId}?assignment=${item.id}&from=student` : "#"} key={item.id}><div><h2>{item.title}</h2><p>{item.instructions || "先生からの指示はありません。"}</p></div><StatusBadge tone={item.due_at && new Date(item.due_at) < new Date() ? "danger" : "success"}>{item.due_at ? new Date(item.due_at).toLocaleDateString("ja-JP") : "期限なし"}</StatusBadge><span className="row-date">取り組む</span></Link>; })}</div> : <EmptyState title="公開中の課題はありません" description="参加コードを入力するか、先生からの課題公開を待ちましょう。" />}</section></main>;
}
