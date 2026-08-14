import Link from "next/link";
import { Activity, BookOpen, Users } from "lucide-react";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { withExperienceRole } from "@/config/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const normalPageGroups = [
  {
    title: "個人ページ",
    description: "教材作成・学習・履歴・キャラクターを確認します。",
    links: [
      ["ホーム", "/personal"],
      ["教材作成", withExperienceRole("/create", "personal")],
      ["教材・学習", withExperienceRole("/materials", "personal")],
      ["履歴", withExperienceRole("/history", "personal")],
      ["キャラクター", withExperienceRole("/characters", "personal")],
    ],
  },
  {
    title: "生徒ページ",
    description: "課題・自主学習・履歴・キャラクターを確認します。",
    links: [
      ["ホーム", "/student"],
      ["課題", "/student/assignments"],
      ["自主学習", withExperienceRole("/create", "student")],
      ["履歴", withExperienceRole("/history", "student")],
      ["キャラクター", withExperienceRole("/characters", "student")],
    ],
  },
  {
    title: "教師ページ",
    description: "教材・クラス・課題・提出を確認します。",
    links: [
      ["ホーム", "/teacher"],
      ["教材作成", withExperienceRole("/create", "teacher")],
      ["教材管理", withExperienceRole("/materials", "teacher")],
      ["クラス", "/teacher/classrooms"],
      ["課題", "/teacher/assignments"],
      ["提出", "/teacher/submissions"],
    ],
  },
] as const;

export default async function AdminDashboard() {
  await requireRole("admin");
  const admin = createAdminClient();
  const [users, materials, generations, failed] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("hub_materials").select("id", { count: "exact", head: true }),
    admin.from("hub_ai_generations").select("id", { count: "exact", head: true }),
    admin.from("hub_ai_generations").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);
  return <main className="shell"><PageHeader eyebrow="管理者" title="システム概要" description="管理者専用機能に加えて、個人・生徒・教師の通常ページを確認できます。機密キーの値は表示しません。" /><div className="stats-grid"><AppCard><Users size={22} /><span className="card-kicker">ユーザー</span><div className="metric-value">{users.count ?? 0}</div><Link href="/admin/users">ロールを確認</Link></AppCard><AppCard><BookOpen size={22} /><span className="card-kicker">教材</span><div className="metric-value">{materials.count ?? 0}</div></AppCard><AppCard><Activity size={22} /><span className="card-kicker">AI生成</span><div className="metric-value">{generations.count ?? 0}</div><p className="muted">失敗 {failed.count ?? 0}</p><Link href="/admin/generations">生成状況を見る</Link></AppCard></div><section className="section-gap" aria-labelledby="normal-pages-heading"><h2 id="normal-pages-heading">通常ページを確認</h2><p className="muted">管理者アカウントのまま、各利用者向けページへ移動できます。</p><div className="role-select-grid section-gap">{normalPageGroups.map(group => <AppCard key={group.title}><h2>{group.title}</h2><p className="muted">{group.description}</p><div className="actions section-gap">{group.links.map(([label, href]) => <Link className="button outline compact" href={href} key={href}>{label}</Link>)}</div></AppCard>)}</div></section></main>;
}
