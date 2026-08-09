import Link from "next/link";
import { notFound } from "next/navigation";
import { getMaterial } from "@/lib/materials";
import { MaterialRenderer } from "@/components/materials/MaterialRenderer";
import { MaterialPrintView } from "@/components/materials/MaterialPrintView";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params, material = await getMaterial(id); if (!material) notFound(); return <main className="shell"><header className="page-head no-print"><div><span className="eyebrow">バージョン {material.version.versionNumber}</span><h1>{material.title}</h1><p>{material.document.metadata.grade}・{material.document.metadata.subject}・{material.document.metadata.unit}</p></div><div className="actions"><Link className="button" href={`/learn/${material.id}`}>この教材で学ぶ</Link><Link className="button secondary" href={`/materials/${material.id}/edit`}>編集</Link></div></header><MaterialRenderer document={material.document}/><MaterialPrintView document={material.document}/></main>; }
