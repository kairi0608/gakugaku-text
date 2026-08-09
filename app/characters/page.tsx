import Link from "next/link";
import { listCharacters } from "@/lib/materials";
export const dynamic = "force-dynamic";
export default async function Page() { const characters = await listCharacters(); return <main className="shell"><header className="page-head"><div><span className="eyebrow">学習パートナー</span><h1>キャラクター</h1></div><Link href="/characters/new" className="button">新しく作る</Link></header><div className="grid">{characters.map(c => <article className="card" key={c.id}><div className="mascot">★</div><span className="pill">{c.stage}</span><h2>{c.name}</h2><p>レベル {c.level}・EXP {c.exp}</p></article>)}{!characters.length && <div className="empty">キャラクターを作ると、学習するたびに成長します。</div>}</div></main>; }
