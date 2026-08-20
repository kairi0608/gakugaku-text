import { notFound } from "next/navigation";
import { PrintWorkspace } from "@/components/materials/PrintWorkspace";
import { requireAnyRole } from "@/lib/auth/require-role";
import { getMaterial } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function MaterialPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAnyRole(["personal", "student", "teacher"]);
  const { id } = await params;
  const material = await getMaterial(id);
  if (!material) notFound();
  return <PrintWorkspace document={material.document} />;
}
