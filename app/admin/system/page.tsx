import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { getEmailDiagnostics } from "@/lib/auth/email-diagnostics";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";
export default async function AdminSystemPage() {
  await requireRole("admin");
  const emailDiagnostics = getEmailDiagnostics();
  const checks = [
    ["Supabase公開接続", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)],
    ["Supabase管理接続", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)],
    ["OpenAIテキスト生成", Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_TEXT_MODEL)],
    ["OpenAI画像生成", Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_IMAGE_MODEL)],
  ] as const;
  return <main className="shell"><PageHeader eyebrow="管理者" title="システム状態" description="設定状況だけを確認します。秘密値は表示しません。" /><div className="settings-stack"><AppCard><SectionHeader title="サービス接続" />{checks.map(([label, ready]) => <div className="setting-row" key={label}><strong>{label}</strong><StatusBadge tone={ready ? "success" : "danger"}>{ready ? "設定済み" : "未設定"}</StatusBadge></div>)}</AppCard><AppCard><SectionHeader title="認証メール設定確認" /><div className="setting-row"><strong>現在の環境</strong><span className="diagnostic-value">{emailDiagnostics.currentEnvironment}</span></div><div className="setting-row"><strong>Application URL</strong><span className="diagnostic-value">{emailDiagnostics.applicationUrl ?? "未設定または不正"}</span></div><div className="setting-row"><strong>Callback URL</strong><span className="diagnostic-value">{emailDiagnostics.callbackUrl ?? "生成できません"}</span></div><div className="setting-row"><strong>APP URL環境変数</strong><StatusBadge tone={emailDiagnostics.appUrlConfigured ? "success" : "danger"}>{emailDiagnostics.appUrlConfigured ? "設定済み" : "未設定"}</StatusBadge></div><div className="setting-row"><strong>Supabase URL</strong><StatusBadge tone={emailDiagnostics.supabaseUrlConfigured ? "success" : "danger"}>{emailDiagnostics.supabaseUrlConfigured ? "設定済み" : "未設定"}</StatusBadge></div><div className="setting-row"><strong>Supabase anon key</strong><StatusBadge tone={emailDiagnostics.supabaseAnonKeyConfigured ? "success" : "danger"}>{emailDiagnostics.supabaseAnonKeyConfigured ? "設定済み" : "未設定"}</StatusBadge></div><p className="notice">メール配送状況はSupabase Auth Logs / SMTP Providerで確認してください。</p></AppCard></div></main>;
}
