/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { EvolutionPanel } from "@/components/characters/EvolutionPanel";
import { requireAnyRole } from "@/lib/auth/require-role";
import { getCharacter } from "@/lib/materials";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const stageLabels: Record<string, string> = { egg: "タマゴ", child: "こども", "learning-partner": "学習パートナー" };
export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAnyRole(["personal", "student"]);
  const { id } = await params;
  const character = await getCharacter(id);
  if (!character) notFound();
  const db = await createClient();
  const [assetsResult, activityResult] = await Promise.all([
    db.from("hub_character_assets").select("id,visual_asset_id,stage,is_active,created_at").eq("character_id", id).order("created_at", { ascending: false }),
    db.from("hub_activity_logs").select("id,event_type,exp_awarded,created_at").order("created_at", { ascending: false }).limit(30),
  ]);
  if (assetsResult.error || activityResult.error) throw new Error("キャラクター履歴を取得できませんでした。");
  const active = assetsResult.data?.find(asset => asset.is_active);
  const nextLevel = character.level * 100;
  return <main className="shell"><PageHeader eyebrow="学習パートナー" title={character.name} description="学習でEXPをため、次の姿をAIで生成してから自分で適用できます。" /><div className="character-detail-grid"><AppCard><div className="character-hero">{active ? <img src={`/api/assets/${active.visual_asset_id}`} alt={`${character.name}の現在の姿`} /> : <div className="image-placeholder">画像を読み込めません</div>}<div><StatusBadge tone="success">{stageLabels[character.stage] ?? character.stage}</StatusBadge><h2>Lv.{character.level}</h2><strong>{character.exp} EXP</strong><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, ((character.exp % 100) / 100) * 100)}%` }} /></div><p className="caption">次のレベルまで {Math.max(0, nextLevel - character.exp)} EXP</p></div></div></AppCard><AppCard><h2>成長履歴</h2><div className="activity-list">{activityResult.data?.map(item => <div className="activity-row" key={item.id}><span>{item.event_type}</span><strong>+{item.exp_awarded} EXP</strong><time>{new Date(item.created_at).toLocaleDateString("ja-JP")}</time></div>)}</div></AppCard></div><AppCard className="section-gap"><h2>進化画像と過去の姿</h2><p className="muted">新しい画像はプレビューとして保存されます。「この姿を使う」を押すまで現在の画像は変わりません。</p><EvolutionPanel characterId={character.id} exp={character.exp} assets={(assetsResult.data ?? []).map(asset => ({ id: asset.id, visualAssetId: asset.visual_asset_id, stage: asset.stage as "egg" | "child" | "learning-partner", isActive: asset.is_active, createdAt: asset.created_at }))} /></AppCard></main>;
}
