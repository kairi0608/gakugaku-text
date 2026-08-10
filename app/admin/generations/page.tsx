import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export default async function AdminGenerationsPage() {
  await requireRole("admin");
  const { data, error } = await createAdminClient().from("hub_ai_generations").select("id,feature,model,status,error_code,created_at,completed_at").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(`AI生成状況を取得できませんでした: ${error.message}`);
  return <main className="shell"><PageHeader eyebrow="管理者" title="AI生成状況" description="直近100件の成功・失敗を確認できます。APIキーの値は表示されません。" /><div className="simple-table" role="table">{(data ?? []).map(item => <div className="simple-table-row" role="row" key={item.id}><div><strong>{item.feature}</strong><small>{item.model}</small></div><StatusBadge tone={item.status === "succeeded" ? "success" : item.status === "failed" ? "danger" : "warning"}>{item.status}</StatusBadge><span>{item.error_code ?? "—"}</span><time>{new Date(item.created_at).toLocaleString("ja-JP")}</time></div>)}</div></main>;
}
