import { PageHeader } from "@/components/design-system/PageHeader";
import { RoleChangeForm } from "@/components/admin/RoleChangeForm";
import { requireRole } from "@/lib/auth/require-role";
import { isUserRole } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export default async function AdminUsersPage() {
  await requireRole("admin");
  const { data, error } = await createAdminClient().from("profiles").select("id,display_name,role,grade_band,created_at").order("created_at", { ascending: false });
  if (error) throw new Error(`ユーザーを取得できませんでした: ${error.message}`);
  return <main className="shell"><PageHeader eyebrow="管理者" title="ユーザーとロール" description="教師・管理者ロールは、ここから管理者だけが割り当てます。" /><div className="simple-table admin-user-table" role="table">{(data ?? []).map(profile => <div className="simple-table-row" role="row" key={profile.id}><div><strong>{profile.display_name}</strong><small>{profile.id}</small></div><span>{profile.grade_band ?? "—"}</span>{isUserRole(profile.role) && <RoleChangeForm userId={profile.id} role={profile.role} />}</div>)}</div></main>;
}
