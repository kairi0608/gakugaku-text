import { notFound } from "next/navigation";
import { PageHeader } from "@/components/design-system/PageHeader";
import { getMaterial } from "@/lib/materials";
import { LearnForm } from "./LearnForm";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await getMaterial(id);
  if (!material) notFound();
  return <main className="shell learn-shell"><PageHeader eyebrow="学習" title={material.title} description={`全${material.document.questions.length}問。1問ずつ、自分のペースで進めましょう。`} /><LearnForm materialId={id} document={material.document} /></main>;
}
