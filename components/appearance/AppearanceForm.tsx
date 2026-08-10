"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useState } from "react";

type Asset = { id: string; generationType: string };
type Settings = { assetId: string | null; fit: "cover" | "contain"; position: "center" | "top" | "bottom" | "left" | "right"; overlayStrength: number; blur: number };

export function AppearanceForm({ assets, initial }: { assets: Asset[]; initial: Settings }) {
  const router = useRouter();
  const [assetId, setAssetId] = useState<string | null>(initial.assetId);
  const [fit, setFit] = useState(initial.fit);
  const [position, setPosition] = useState(initial.position);
  const [overlayStrength, setOverlay] = useState(initial.overlayStrength);
  const [blur, setBlur] = useState(initial.blur);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/settings/appearance", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ assetId, fit, position, overlayStrength, blur }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(result.error ?? "保存できませんでした。"); return; }
    setMessage("背景設定を保存しました。再読み込みすると全画面に反映されます。"); router.refresh();
  }
  return <div className="appearance-editor"><div className="background-grid"><button type="button" className={`background-choice ${assetId === null ? "selected" : ""}`} onClick={() => setAssetId(null)}><span className="no-background">背景なし</span></button>{assets.map(asset => <button type="button" className={`background-choice ${assetId === asset.id ? "selected" : ""}`} onClick={() => setAssetId(asset.id)} key={asset.id}><img src={`/api/assets/${asset.id}`} alt={`${asset.generationType === "ai" ? "AI生成" : "アップロード"}背景`} /></button>)}</div><div className="form-grid"><label className="field"><span>表示方法</span><select value={fit} onChange={event => setFit(event.target.value as "cover" | "contain")}><option value="cover">画面を覆う</option><option value="contain">全体を表示</option></select></label><label className="field"><span>位置</span><select value={position} onChange={event => setPosition(event.target.value as Settings["position"])}><option value="center">中央</option><option value="top">上</option><option value="bottom">下</option><option value="left">左</option><option value="right">右</option></select></label><label className="field"><span>読みやすさオーバーレイ {Math.round(overlayStrength * 100)}%</span><input type="range" min="0.55" max="0.9" step="0.01" value={overlayStrength} onChange={event => setOverlay(Number(event.target.value))} /></label><label className="field"><span>ぼかし {blur}px</span><input type="range" min="0" max="20" value={blur} onChange={event => setBlur(Number(event.target.value))} /></label></div><button className="button" type="button" onClick={save} disabled={busy}>{busy ? "保存中…" : "背景を適用"}</button>{message && <p className={message.includes("できません") ? "notice error" : "notice success"}>{message}</p>}</div>;
}

export function BackgroundGenerator() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function generate(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(""); const form = new FormData(event.currentTarget); const response = await fetch("/api/backgrounds/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }); const result = await response.json(); setBusy(false); if (!response.ok) { setMessage(result.error ?? "生成できませんでした。"); return; } setMessage("背景を生成しました。保存済み背景から選択できます。"); router.refresh(); }
  return <form className="workflow-form" onSubmit={generate}><div className="form-grid"><label className="field full"><span>希望する背景</span><textarea name="request" maxLength={1000} placeholder="静かな図書室と朝の光" required /></label><label className="field"><span>対象</span><select name="audienceStage"><option value="elementary">小学生</option><option value="middle">中学生</option><option value="high">高校生</option><option value="adult">大人</option></select></label><label className="field"><span>好きな色</span><input name="colors" defaultValue="青、緑" required /></label><label className="field"><span>雰囲気</span><input name="mood" defaultValue="落ち着いて集中できる" required /></label></div><button className="button" disabled={busy}>{busy ? "AI生成中…" : "AIで背景を生成"}</button>{message && <p className={message.includes("できません") ? "notice error" : "notice success"}>{message}</p>}</form>;
}

export function BackgroundUploader() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function upload(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(""); const response = await fetch("/api/backgrounds/upload", { method: "POST", body: new FormData(event.currentTarget) }); const result = await response.json(); setBusy(false); if (!response.ok) { setMessage(result.error ?? "アップロードできませんでした。"); return; } event.currentTarget.reset(); setMessage("背景を保存しました。"); router.refresh(); }
  return <form className="inline-workflow-form" onSubmit={upload}><label className="field"><span>PNG / JPEG / WebP（10MB以下）</span><input name="file" type="file" accept="image/png,image/jpeg,image/webp" required /></label><button className="button outline" disabled={busy}>{busy ? "確認中…" : "画像をアップロード"}</button>{message && <p className={message.includes("できません") ? "notice error" : "notice success"}>{message}</p>}</form>;
}
