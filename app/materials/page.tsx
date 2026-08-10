import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { listMaterials } from "@/lib/materials";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { draft: "下書き", ready: "学習可能", published: "公開済み" };

export default async function MaterialsPage() {
  let loadError = false;
  const materials = await listMaterials().catch(() => { loadError = true; return []; });
  return (
    <main className="shell">
      <PageHeader eyebrow="学習" title="教材一覧" description="作成した教材を選んで、内容の確認や学習を始められます。" action={<Link className="button" href="/create"><Plus aria-hidden="true" size={18} />新しい教材</Link>} />
      {loadError && <p className="notice error">教材を読み込めませんでした。設定画面でSupabaseの接続情報を確認してください。</p>}
      {materials.length ? <div className="material-list">{materials.map(material => <Link className="material-row" href={`/materials/${material.id}`} key={material.id}><span className="material-icon"><BookOpen aria-hidden="true" size={20} /></span><div><h2>{material.title}</h2><p>更新: {new Date(material.updatedAt).toLocaleString("ja-JP")}</p></div><StatusBadge tone={material.status === "ready" ? "success" : "default"}>{statusLabels[material.status] ?? material.status}</StatusBadge><span className="row-date">内容を見る</span></Link>)}</div> : !loadError && <EmptyState title="教材がまだありません" description="学年・教科・単元を選んで、最初の教材を作りましょう。" action={<Link className="button" href="/create">教材を作る</Link>} />}
    </main>
  );
}
