import { notFound } from "next/navigation";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("teacher");
  const { id } = await params;
  const db = await createClient();
  const { data: classroom } = await db.from("hub_classrooms").select("id,name,join_code").eq("id", id).maybeSingle();
  if (!classroom) notFound();
  const { data: members, error } = await db.from("hub_classroom_members").select("student_id,joined_at").eq("classroom_id", id).order("joined_at");
  if (error) throw new Error(`名簿を取得できませんでした: ${error.message}`);
  const studentIds = (members ?? []).map(member => member.student_id);
  const profiles = studentIds.length ? await db.from("profiles").select("id,display_name,grade_band").in("id", studentIds) : { data: [], error: null };
  if (profiles.error) throw new Error(`生徒プロフィールを取得できませんでした: ${profiles.error.message}`);
  const profileMap = new Map((profiles.data ?? []).map(profile => [profile.id, profile]));
  return <main className="shell"><PageHeader eyebrow="クラス概要" title={classroom.name} description={`参加コード: ${classroom.join_code}`} /><AppCard><h2>生徒名簿</h2>{members?.length ? <div className="simple-table" role="table">{members.map(member => { const profile = profileMap.get(member.student_id); return <div className="simple-table-row" role="row" key={member.student_id}><strong>{profile?.display_name ?? "生徒"}</strong><span>{profile?.grade_band ?? "学年未設定"}</span><time>{new Date(member.joined_at).toLocaleDateString("ja-JP")}</time></div>; })}</div> : <EmptyState title="参加している生徒はいません" description="参加コードを生徒に伝えてください。" />}</AppCard></main>;
}
