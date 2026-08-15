import { notFound } from "next/navigation";
import { PageHeader } from "@/components/design-system/PageHeader";
import { requireAnyRole } from "@/lib/auth/require-role";
import { getMaterial, getMaterialVersion } from "@/lib/materials";
import { createClient } from "@/lib/supabase/server";
import { LearnForm } from "./LearnForm";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ assignment?: string }> }) {
  const current = await requireAnyRole(["personal", "student", "teacher"]);
  const { id } = await params;
  const { assignment: assignmentId } = await searchParams;
  if (assignmentId) {
    if (current.profile.role !== "student") notFound();
    const db = await createClient();
    const { data: assignment } = await db.from("hub_assignments").select("id,title,material_version_id").eq("id", assignmentId).maybeSingle();
    if (!assignment) notFound();
    const version = await getMaterialVersion(assignment.material_version_id);
    if (!version || version.materialId !== id) notFound();
    return <main className="shell learn-shell"><PageHeader eyebrow="クラス課題" title={assignment.title} description={`全${version.documentJson.questions.length}問。配布時の教材バージョンで取り組みます。`} /><LearnForm materialId={id} materialVersionId={version.id} assignmentId={assignment.id} document={version.documentJson} role="student" learnerName={current.profile.displayName} /></main>;
  }
  const material = await getMaterial(id);
  if (!material) notFound();
  return <main className="shell learn-shell"><PageHeader eyebrow={current.profile.role === "teacher" ? "教材プレビュー" : "自主学習"} title={material.title} description={`全${material.document.questions.length}問。1問ずつ自分のペースで進めましょう。`} /><LearnForm materialId={id} document={material.document} role={current.profile.role} learnerName={current.profile.displayName} /></main>;
}
