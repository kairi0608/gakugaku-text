import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { listCharacters } from "@/lib/materials";

export const dynamic = "force-dynamic";
const stageLabels: Record<string, string> = { egg: "タマゴ", child: "こども", "learning-partner": "学習パートナー" };

export default async function CharactersPage() {
  let loadError = false;
  const characters = await listCharacters().catch(() => { loadError = true; return []; });
  const current = characters[0];
  const progress = current ? current.exp % 100 : 0;
  return (
    <main className="shell">
      <PageHeader eyebrow="学習パートナー" title="キャラクター" description="学習を重ねるとEXPがたまり、キャラクターが成長します。" action={<Link href="/characters/new" className="button"><Plus aria-hidden="true" size={18} />新しく作る</Link>} />
      {loadError && <p className="notice error">キャラクターを読み込めませんでした。設定画面でSupabaseの接続情報を確認してください。</p>}
      {current ? <div className="character-layout">
        <AppCard><SectionHeader title="現在のキャラクター" /><div className="current-character"><div className="character-large" role="img" aria-label={`${current.name}の画像はまだ生成されていません`}><Sparkles aria-hidden="true" /></div><div className="character-info"><StatusBadge tone="success">{stageLabels[current.stage] ?? current.stage}</StatusBadge><h2>{current.name}</h2><p className="level">Lv.{current.level}・EXP {current.exp}</p><div className="progress-track" aria-label={`次のレベルまでの進捗 ${progress}%`}><div className="progress-fill" style={{ width: `${progress}%` }} /></div><p className="caption">次のレベルまで あと {100 - progress} EXP</p></div></div></AppCard>
        <AppCard><SectionHeader title="成長記録" /><div className="character-records"><div className="record"><span>キャラクター作成</span><time className="caption">{new Date(current.createdAt).toLocaleDateString("ja-JP")}</time></div><div className="record"><span>最終更新</span><time className="caption">{new Date(current.updatedAt).toLocaleDateString("ja-JP")}</time></div><div className="record"><span>現在のレベル</span><strong>Lv.{current.level}</strong></div></div></AppCard>
      </div> : !loadError && <EmptyState title="キャラクターがまだいません" description="好きな色やモチーフを選んで、最初の学習パートナーを作りましょう。" action={<Link className="button" href="/characters/new">キャラクターを作る</Link>} />}
      {characters.length > 1 && <AppCard style={{ marginTop: 16 }}><SectionHeader title="ほかのキャラクター" /><div className="material-list">{characters.slice(1).map(character => <div className="material-row" key={character.id}><span className="material-icon"><Sparkles aria-hidden="true" size={19} /></span><div><h2>{character.name}</h2><p>Lv.{character.level}・EXP {character.exp}</p></div><StatusBadge>{stageLabels[character.stage] ?? character.stage}</StatusBadge><span className="row-date">{new Date(character.updatedAt).toLocaleDateString("ja-JP")}</span></div>)}</div></AppCard>}
    </main>
  );
}
