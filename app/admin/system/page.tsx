import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";
export default async function AdminSystemPage() {
  await requireRole("admin");
  const checks = [
    ["Supabase公開接続", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)],
    ["Supabase管理接続", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)],
    ["OpenAIテキスト生成", Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_TEXT_MODEL)],
    ["OpenAI画像生成", Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_IMAGE_MODEL)],
  ] as const;
  return <main className="shell"><PageHeader eyebrow="管理者" title="システム状態" description="環境変数が設定されているかだけを確認します。秘密値は表示しません。" /><AppCard>{checks.map(([label, ready]) => <div className="setting-row" key={label}><strong>{label}</strong><StatusBadge tone={ready ? "success" : "danger"}>{ready ? "設定済み" : "未設定"}</StatusBadge></div>)}</AppCard></main>;
}
