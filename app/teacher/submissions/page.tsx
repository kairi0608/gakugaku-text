import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ReviewForm } from "@/components/workflows/ReviewForm";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function TeacherSubmissionsPage() {
  await requireRole("teacher");
  const db = await createClient();
  const { data, error } = await db.from("hub_assignment_submissions").select("id,student_id,attempt_id,status,submitted_at,teacher_feedback,teacher_score,hub_assignments(title)").order("submitted_at", { ascending: false });
  if (error) throw new Error(`提出を取得できませんでした: ${error.message}`);
  const studentIds = [...new Set((data ?? []).map(item => item.student_id))];
  const profiles = studentIds.length ? await db.from("profiles").select("id,display_name").in("id", studentIds) : { data: [], error: null };
  const names = new Map((profiles.data ?? []).map(profile => [profile.id, profile.display_name]));
  return <main className="shell"><PageHeader eyebrow="教師ページ" title="提出確認" description="自分のクラスに所属する生徒の提出だけを確認できます。" />{data?.length ? <div className="submission-list">{data.map(item => { const assignment = Array.isArray(item.hub_assignments) ? item.hub_assignments[0] : item.hub_assignments; return <AppCard key={item.id}><div className="submission-heading"><div><h2>{assignment?.title ?? "課題"}</h2><p className="muted">{names.get(item.student_id) ?? "生徒"}・{item.submitted_at ? new Date(item.submitted_at).toLocaleString("ja-JP") : "未提出"}</p></div><StatusBadge tone={item.status === "reviewed" ? "success" : "warning"}>{item.status === "reviewed" ? "確認済み" : "確認待ち"}</StatusBadge></div>{item.status === "reviewed" ? <p>{item.teacher_feedback} {item.teacher_score != null && <strong>{item.teacher_score}点</strong>}</p> : <ReviewForm submissionId={item.id} />}</AppCard>; })}</div> : <EmptyState title="確認待ちの提出はありません" description="生徒が課題を提出すると、ここに表示されます。" />}</main>;
}
