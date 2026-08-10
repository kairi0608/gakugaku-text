import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { AppearanceForm, BackgroundGenerator, BackgroundUploader } from "@/components/appearance/AppearanceForm";
import { requireAnyRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function AppearancePage() {
  const current = await requireAnyRole(["personal", "student", "teacher"]);
  const db = await createClient();
  const [assetsResult, settingsResult] = await Promise.all([
    db.from("hub_visual_assets").select("id,generation_type").eq("kind", "app-background").order("created_at", { ascending: false }),
    db.from("hub_user_settings").select("*").eq("user_id", current.user.id).maybeSingle(),
  ]);
  if (assetsResult.error || settingsResult.error) throw new Error("背景設定を取得できませんでした。");
  const settings = settingsResult.data;
  return <main className="shell"><PageHeader eyebrow="外観" title="背景カスタマイズ" description="AI生成または手持ちの画像から背景を選び、文字の読みやすさも調整できます。" /><AppCard><h2>AI背景生成</h2><BackgroundGenerator /></AppCard><AppCard className="section-gap"><h2>画像アップロード</h2><BackgroundUploader /></AppCard><AppCard className="section-gap"><h2>保存済み背景と表示設定</h2><AppearanceForm assets={(assetsResult.data ?? []).map(asset => ({ id: asset.id, generationType: asset.generation_type }))} initial={{ assetId: settings?.active_background_asset_id ?? null, fit: settings?.background_fit ?? "cover", position: settings?.background_position ?? "center", overlayStrength: Number(settings?.background_overlay ?? 0.64), blur: Number(settings?.background_blur ?? 0) }} /></AppCard></main>;
}
