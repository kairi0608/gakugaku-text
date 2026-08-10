import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { CreateClassroomForm } from "@/components/workflows/ClassroomForms";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function TeacherClassroomsPage() {
  await requireRole("teacher");
  const db = await createClient();
  const { data, error } = await db.from("hub_classrooms").select("id,name,join_code,created_at").order("created_at", { ascending: false });
  if (error) throw new Error(`クラスを取得できませんでした: ${error.message}`);
  return <main className="shell"><PageHeader eyebrow="教師ページ" title="クラス" description="参加コードで生徒と安全につながり、課題を配布します。" /><div className="two-column-grid"><AppCard><h2>新しいクラス</h2><CreateClassroomForm /></AppCard><AppCard><h2>参加コードの使い方</h2><p className="muted">生徒に8文字のコードを伝えてください。生徒は自分のアカウントから参加します。</p></AppCard></div>{data?.length ? <div className="material-list section-gap">{data.map(classroom => <Link className="material-row" href={`/teacher/classrooms/${classroom.id}`} key={classroom.id}><div><h2>{classroom.name}</h2><p>参加コード <strong className="code-token">{classroom.join_code}</strong></p></div><span className="row-date">名簿・課題を見る</span></Link>)}</div> : <EmptyState title="クラスはまだありません" description="最初のクラスを作成すると、参加コードが発行されます。" />}</main>;
}
