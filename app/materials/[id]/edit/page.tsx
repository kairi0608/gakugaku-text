import { Save } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { parseExperienceRole, withExperienceRole } from "@/config/navigation";
import { getMaterial, saveMaterial } from "@/lib/materials";

export default async function EditMaterialPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string | string[] }> }) {
  const { id } = await params;
  const role = parseExperienceRole((await searchParams).from) ?? "personal";
  const material = await getMaterial(id);
  if (!material) notFound();
  async function update(form: FormData) {
    "use server";
    const current = await getMaterial(id);
    if (!current) return;
    const document = { ...current.document, metadata: { ...current.document.metadata, title: String(form.get("title")), objective: String(form.get("objective")) } };
    await saveMaterial(document, id);
    redirect(withExperienceRole(`/materials/${id}`, role));
  }
  return <main className="shell"><PageHeader eyebrow="教材編集" title="教材の基本情報を編集" description="変更内容は新しいバージョンとして保存されます。" /><AppCard as="form" action={update} className="form-section"><label className="field"><span>タイトル</span><input name="title" defaultValue={material.title} required /></label><label className="field"><span>学習目標</span><textarea name="objective" defaultValue={material.document.metadata.objective} required /></label><button className="button" type="submit"><Save aria-hidden="true" size={17} />変更を保存</button></AppCard></main>;
}
