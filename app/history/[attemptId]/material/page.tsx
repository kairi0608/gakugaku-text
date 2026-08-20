import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/design-system/PageHeader";
import { MaterialRenderer } from "@/components/materials/MaterialRenderer";
import { requireAnyRole } from "@/lib/auth/require-role";
import { getAttemptDetail } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function HistoricalMaterialPage({ params }: { params: Promise<{ attemptId: string }> }) {
  await requireAnyRole(["personal", "student", "teacher"]);
  const { attemptId } = await params;
  const detail = await getAttemptDetail(attemptId);
  if (!detail) notFound();
  return <main className="shell">
    <PageHeader eyebrow={`学習時の教材・Version ${detail.version.versionNumber}`} title={detail.material.title} description="教材が後から編集されていても、学習時に固定された内容を表示しています。" action={<Link className="button outline" href={`/history/${attemptId}`}>学習結果へ戻る</Link>} />
    <MaterialRenderer document={detail.version.documentJson} mode="history" />
  </main>;
}
