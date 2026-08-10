import Link from "next/link";
import { Activity, BookOpen, Users } from "lucide-react";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export default async function AdminDashboard() {
  await requireRole("admin");
  const admin = createAdminClient();
  const [users, materials, generations, failed] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("hub_materials").select("id", { count: "exact", head: true }),
    admin.from("hub_ai_generations").select("id", { count: "exact", head: true }),
    admin.from("hub_ai_generations").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);
  return <main className="shell"><PageHeader eyebrow="管理者" title="システム概要" description="利用数とAI生成状況を確認します。機密キーの値は表示しません。" /><div className="stats-grid"><AppCard><Users size={22} /><span className="card-kicker">ユーザー</span><div className="metric-value">{users.count ?? 0}</div><Link href="/admin/users">ロールを確認</Link></AppCard><AppCard><BookOpen size={22} /><span className="card-kicker">教材</span><div className="metric-value">{materials.count ?? 0}</div></AppCard><AppCard><Activity size={22} /><span className="card-kicker">AI生成</span><div className="metric-value">{generations.count ?? 0}</div><p className="muted">失敗 {failed.count ?? 0}</p><Link href="/admin/generations">生成状況を見る</Link></AppCard></div></main>;
}
