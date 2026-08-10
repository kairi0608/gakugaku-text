/* eslint-disable jsx-a11y/alt-text */
import { Bot, ChevronRight, CircleHelp, Image, Scale, UserRound } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { experienceRoleDescriptions, experienceRoleLabels } from "@/config/navigation";
import { requireAnyRole } from "@/lib/auth/require-role";
import packageJson from "@/package.json";
import { BackupPanel } from "./BackupPanel";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const current = await requireAnyRole(["personal", "student", "teacher"]);
  const role = current.profile.role;
  const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const aiReady = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_TEXT_MODEL && process.env.OPENAI_IMAGE_MODEL);
  return <main className="shell"><PageHeader eyebrow="アカウントと環境" title="設定" description="プロフィール、外観、データ、アプリ情報を確認できます。" /><div className="settings-stack"><AppCard className="settings-section"><h2><UserRound size={19} />プロフィール</h2><div className="setting-row"><div><strong>{current.profile.displayName}</strong><span className="row-meta">{current.user.email}</span></div><StatusBadge>{experienceRoleLabels[role]}</StatusBadge></div><p className="caption">{experienceRoleDescriptions[role]}。ロールは自分では変更できません。</p></AppCard><AppCard className="settings-section"><h2><Image size={19} />外観</h2><Link className="legal-link" href="/settings/appearance"><span>AI生成・アップロード背景を設定</span><ChevronRight size={17} /></Link></AppCard><AppCard className="settings-section"><h2><Bot size={19} />サービス状態</h2><p className="muted">秘密値は画面に表示しません。</p><div className="setting-row"><strong>AI生成</strong><StatusBadge tone={aiReady ? "success" : "warning"}>{aiReady ? "利用可能" : "設定が必要"}</StatusBadge></div><div className="setting-row"><strong>データ保存</strong><StatusBadge tone={supabaseReady ? "success" : "danger"}>{supabaseReady ? "接続済み" : "設定が必要"}</StatusBadge></div></AppCard><BackupPanel /><AppCard className="settings-section"><h2><CircleHelp size={19} />アプリ情報</h2><div className="setting-row"><strong>アプリ名</strong><span>ガクガクAIシステム</span></div><div className="setting-row"><strong>バージョン</strong><span>{packageJson.version}</span></div></AppCard><AppCard className="settings-section"><h2><Scale size={19} />法的情報</h2><div className="legal-links"><Link className="legal-link" href="/privacy"><span>プライバシーポリシー</span><ChevronRight size={17} /></Link><Link className="legal-link" href="/terms"><span>利用規約</span><ChevronRight size={17} /></Link></div></AppCard></div></main>;
}
