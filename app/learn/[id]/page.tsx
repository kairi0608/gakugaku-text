import { notFound } from "next/navigation";
import { PageHeader } from "@/components/design-system/PageHeader";
import { parseExperienceRole } from "@/config/navigation";
import { getMaterial } from "@/lib/materials";
import { LearnForm } from "./LearnForm";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string | string[] }> }) {
  const { id } = await params;
  const role = parseExperienceRole((await searchParams).from) ?? "personal";
  const material = await getMaterial(id);
  if (!material) notFound();
  return <main className="shell learn-shell"><PageHeader eyebrow={role === "student" ? "課題" : role === "teacher" ? "教材プレビュー" : "学習"} title={material.title} description={`全${material.document.questions.length}問。1問ずつ、自分のペースで進めましょう。`} /><LearnForm materialId={id} document={material.document} role={role} /></main>;
}
