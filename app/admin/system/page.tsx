import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { requireRole } from "@/lib/auth/require-role";
import { getSystemDiagnostics, type DiagnosticCheck } from "@/lib/system/diagnostics";

export const dynamic = "force-dynamic";
export default async function AdminSystemPage() {
  await requireRole("admin");
  const diagnostics = await getSystemDiagnostics();
  return <main className="shell"><PageHeader eyebrow="管理者" title="システム状態" description="運用に必要な接続先を実際に確認します。秘密値やユーザーデータは表示しません。" /><div className="settings-stack">
    <AppCard><SectionHeader title="認証" /><DiagnosticRow label="Application URL" ready={diagnostics.auth.appUrlConfigured} value={diagnostics.auth.appUrl ?? "未設定または不正"} /><DiagnosticRow label="Supabase URL" ready={diagnostics.auth.supabaseUrlConfigured} /><DiagnosticRow label="Supabase anon key" ready={diagnostics.auth.supabaseAnonKeyConfigured} /><DiagnosticRow label="Service role key" ready={diagnostics.auth.serviceRoleConfigured} /><div className="setting-row"><strong>Callback URL</strong><span className="diagnostic-value">{diagnostics.auth.callbackUrl ?? "生成できません"}</span></div></AppCard>
    <AppCard><SectionHeader title="Database Migration" /><p className="muted">002 → 003 → 004の順に適用し、すべて「利用可能」になることを確認してください。</p><div className="diagnostic-list">{diagnostics.database.map(check => <CheckRow check={check} key={check.id} />)}</div></AppCard>
    <AppCard><SectionHeader title="Storage" /><CheckRow check={diagnostics.storage} /><p className="caption">bucketはPrivateである必要があります。他ユーザーのファイル一覧は取得しません。</p></AppCard>
    <AppCard><SectionHeader title="OpenAI" /><DiagnosticRow label="Text AI" ready={diagnostics.ai.textConfigured} /><DiagnosticRow label="Image AI" ready={diagnostics.ai.imageConfigured} /><p className="caption">APIキーやモデル名の値本体は表示しません。</p></AppCard>
    <AppCard><SectionHeader title="Email" /><DiagnosticRow label="アプリ側callback設定" ready={Boolean(diagnostics.auth.callbackUrl)} value={diagnostics.auth.callbackUrl ?? undefined} /><p className="notice">メール配送状況はSupabase Auth Logs / SMTP Providerで確認してください。アプリの設定済み表示は実際の配送成功を保証しません。</p></AppCard>
  </div></main>;
}

function DiagnosticRow({ label, ready, value }: { label: string; ready: boolean; value?: string }) {
  return <div className="setting-row"><strong>{label}</strong><span className="diagnostic-result">{value && <span className="diagnostic-value">{value}</span>}<StatusBadge tone={ready ? "success" : "danger"}>{ready ? "設定済み" : "未設定"}</StatusBadge></span></div>;
}

function CheckRow({ check }: { check: DiagnosticCheck }) {
  return <div className="setting-row"><code>{check.label}</code><span className="diagnostic-result">{check.code && <code className="diagnostic-code">{check.code}</code>}<StatusBadge tone={check.ready ? "success" : "danger"}>{check.ready ? "利用可能" : "利用不可"}</StatusBadge></span></div>;
}
