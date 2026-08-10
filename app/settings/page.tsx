import { Bot, ChevronRight, CircleHelp, Scale } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import packageJson from "@/package.json";
import { BackupPanel } from "./BackupPanel";

export default function SettingsPage() {
  const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const aiReady = Boolean(process.env.OPENAI_API_KEY);
  return (
    <main className="shell">
      <PageHeader eyebrow="環境とデータ" title="設定" description="AI連携、保存先、バックアップ、アプリ情報を確認できます。" />
      <div className="settings-stack">
        <AppCard className="settings-section"><h2><Bot aria-hidden="true" size={19} />AI設定</h2><p className="muted">秘密の値そのものは表示しません。Vercelの環境変数で管理してください。</p><div className="setting-row"><div><strong>OpenAI</strong><span className="row-meta">教材・画像生成に使用</span></div><StatusBadge tone={aiReady ? "success" : "warning"}>{aiReady ? "設定済み" : "未設定"}</StatusBadge></div><div className="setting-row"><div><strong>Supabase</strong><span className="row-meta">教材と学習データの保存に使用</span></div><StatusBadge tone={supabaseReady ? "success" : "danger"}>{supabaseReady ? "接続情報あり" : "未設定"}</StatusBadge></div></AppCard>
        <BackupPanel />
        <AppCard className="settings-section"><h2><CircleHelp aria-hidden="true" size={19} />アプリ情報</h2><div className="setting-row"><strong>アプリ名</strong><span>ガクガクAIシステム</span></div><div className="setting-row"><strong>バージョン</strong><span>{packageJson.version}</span></div></AppCard>
        <AppCard className="settings-section"><h2><Scale aria-hidden="true" size={19} />法的情報</h2><div className="legal-links"><Link className="legal-link" href="/privacy"><span>プライバシーポリシー</span><ChevronRight aria-hidden="true" size={17} /></Link><Link className="legal-link" href="/terms"><span>利用規約</span><ChevronRight aria-hidden="true" size={17} /></Link></div></AppCard>
      </div>
    </main>
  );
}
