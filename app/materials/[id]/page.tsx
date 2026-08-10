import { Edit3, Play } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/design-system/PageHeader";
import { MaterialPrintView } from "@/components/materials/MaterialPrintView";
import { MaterialRenderer } from "@/components/materials/MaterialRenderer";
import { parseExperienceRole, withExperienceRole } from "@/config/navigation";
import { getMaterial } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function MaterialPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string | string[] }> }) {
  const { id } = await params;
  const role = parseExperienceRole((await searchParams).from) ?? "personal";
  const material = await getMaterial(id);
  if (!material) notFound();
  return (
    <main className="shell detail-layout">
      <div className="no-print"><PageHeader eyebrow={`教材バージョン ${material.version.versionNumber}`} title={material.title} description={`${material.document.metadata.grade}・${material.document.metadata.subject}・${material.document.metadata.unit}`} action={<div className="actions mobile-stack"><Link className="button" href={withExperienceRole(`/learn/${material.id}`, role)}><Play aria-hidden="true" size={17} />{role === "student" ? "課題を始める" : role === "teacher" ? "教材を試す" : "学習を始める"}</Link><Link className="button outline" href={withExperienceRole(`/materials/${material.id}/edit`, role)}><Edit3 aria-hidden="true" size={17} />編集</Link></div>} /></div>
      <MaterialRenderer document={material.document} />
      <MaterialPrintView document={material.document} />
    </main>
  );
}
