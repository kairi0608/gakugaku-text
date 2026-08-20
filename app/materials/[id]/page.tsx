import { Edit3, Play, Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/design-system/PageHeader";
import { MaterialPrintView } from "@/components/materials/MaterialPrintView";
import { MaterialRenderer } from "@/components/materials/MaterialRenderer";
import { requireAnyRole } from "@/lib/auth/require-role";
import { getMaterial } from "@/lib/materials";
import { withExperienceRole } from "@/config/navigation";

export const dynamic = "force-dynamic";
export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const current = await requireAnyRole(["personal", "student", "teacher"]);
  const { id } = await params;
  const material = await getMaterial(id);
  if (!material) notFound();
  const role = current.profile.role;
  return <main className="shell detail-layout"><div className="no-print"><PageHeader eyebrow={`教材バージョン ${material.version.versionNumber}`} title={material.title} description={`${material.document.metadata.grade}・${material.document.metadata.subject}・${material.document.metadata.unit}`} action={<div className="actions mobile-stack"><Link className="button" href={withExperienceRole(`/learn/${material.id}`, role)}><Play aria-hidden="true" size={17} />{role === "teacher" ? "教材を試す" : "学習を始める"}</Link><Link className="button secondary" href={`/materials/${material.id}/print`}><Printer aria-hidden="true" size={17} />PDF保存 / 印刷</Link>{role !== "student" && <Link className="button outline" href={withExperienceRole(`/materials/${material.id}/edit`, role)}><Edit3 aria-hidden="true" size={17} />編集</Link>}</div>} /></div><MaterialRenderer document={material.document} /><MaterialPrintView document={material.document} /></main>;
}
