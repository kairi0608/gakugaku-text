import { Edit3, Play } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/design-system/PageHeader";
import { MaterialPrintView } from "@/components/materials/MaterialPrintView";
import { MaterialRenderer } from "@/components/materials/MaterialRenderer";
import { getMaterial } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await getMaterial(id);
  if (!material) notFound();
  return (
    <main className="shell detail-layout">
      <div className="no-print"><PageHeader eyebrow={`教材バージョン ${material.version.versionNumber}`} title={material.title} description={`${material.document.metadata.grade}・${material.document.metadata.subject}・${material.document.metadata.unit}`} action={<div className="actions mobile-stack"><Link className="button" href={`/learn/${material.id}`}><Play aria-hidden="true" size={17} />学習を始める</Link><Link className="button outline" href={`/materials/${material.id}/edit`}><Edit3 aria-hidden="true" size={17} />編集</Link></div>} /></div>
      <MaterialRenderer document={material.document} />
      <MaterialPrintView document={material.document} />
    </main>
  );
}
