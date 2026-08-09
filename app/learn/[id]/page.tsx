import { notFound } from "next/navigation";
import { getMaterial } from "@/lib/materials";
import { LearnForm } from "./LearnForm";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params, material = await getMaterial(id); if (!material) notFound(); return <main className="shell"><header className="page-head"><div><span className="eyebrow">学習モード</span><h1>{material.title}</h1><p>全{material.document.questions.length}問。自分のペースで進めましょう。</p></div></header><LearnForm materialId={id} document={material.document}/></main>; }
