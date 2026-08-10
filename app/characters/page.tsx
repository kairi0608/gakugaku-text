/* eslint-disable @next/next/no-img-element */
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { requireAnyRole } from "@/lib/auth/require-role";
import { listCharacters } from "@/lib/materials";
import { createClient } from "@/lib/supabase/server";
import { withExperienceRole } from "@/config/navigation";

export const dynamic = "force-dynamic";
const stageLabels: Record<string, string> = { egg: "タマゴ", child: "こども", "learning-partner": "学習パートナー" };
export default async function CharactersPage() {
  const current = await requireAnyRole(["personal", "student"]);
  const role = current.profile.role;
  const characters = await listCharacters();
  const db = await createClient();
  const ids = characters.map(character => character.id);
  const assets = ids.length ? await db.from("hub_character_assets").select("character_id,visual_asset_id").in("character_id", ids).eq("is_active", true) : { data: [], error: null };
  if (assets.error) throw new Error(`キャラクター画像を取得できませんでした: ${assets.error.message}`);
  const imageByCharacter = new Map((assets.data ?? []).map(asset => [asset.character_id, asset.visual_asset_id]));
  return <main className="shell"><PageHeader eyebrow="学習パートナー" title="キャラクター" description="学習でEXPが増え、成長後の姿をAIで作って選べます。" action={<Link href={withExperienceRole("/characters/new", role)} className="button"><Plus size={18} />新しく作る</Link>} />{characters.length ? <div className="character-card-grid">{characters.map(character => { const image = imageByCharacter.get(character.id); return <Link href={withExperienceRole(`/characters/${character.id}`, role)} key={character.id} className="character-link-card"><AppCard>{image ? <img className="character-card-image" src={`/api/assets/${image}`} alt={`${character.name}の現在の姿`} /> : <div className="character-card-image image-placeholder"><Sparkles /></div>}<StatusBadge tone="success">{stageLabels[character.stage] ?? character.stage}</StatusBadge><h2>{character.name}</h2><p>Lv.{character.level}・{character.exp} EXP</p><span className="section-link">成長と画像履歴を見る</span></AppCard></Link>; })}</div> : <EmptyState title="キャラクターがまだいません" description="好きな色やモチーフから、オリジナルのタマゴ画像をAIで生成します。" action={<Link className="button" href={withExperienceRole("/characters/new", role)}>キャラクターを作る</Link>} />}</main>;
}
