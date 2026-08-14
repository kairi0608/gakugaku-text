"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson, userErrorMessage } from "@/lib/http/client-json";

type Stage = "egg" | "child" | "learning-partner";
type Asset = { id: string; visualAssetId: string; stage: Stage; isActive: boolean; createdAt: string };
const thresholds: Record<Stage, number> = { egg: 0, child: 100, "learning-partner": 300 };
const labels: Record<Stage, string> = { egg: "タマゴ", child: "こども", "learning-partner": "学習パートナー" };

export function EvolutionPanel({ characterId, exp, assets }: { characterId: string; exp: number; assets: Asset[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<Asset | null>(null);
  async function generate(stage: Stage) {
    setBusy(true); setMessage("");
    try {
      const result = await requestJson<{ characterAssetId: string; assetId: string }>("/api/characters/images", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ characterId, stage, request: "これまでの特徴を大切にした、親しみやすい成長姿" }) }, "進化画像を生成できませんでした。");
      setPreview({ id: result.characterAssetId, visualAssetId: result.assetId, stage, isActive: false, createdAt: new Date().toISOString() });
    } catch (reason) {
      setMessage(userErrorMessage(reason, "進化画像を生成できませんでした。"));
    } finally {
      setBusy(false);
    }
  }
  async function apply(asset: Asset) {
    setBusy(true); setMessage("");
    try {
      await requestJson(`/api/characters/${characterId}/evolution/apply`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ characterAssetId: asset.id }) }, "画像を適用できませんでした。");
      setPreview(null); setMessage(`${labels[asset.stage]}の姿を適用しました。`); router.refresh();
    } catch (reason) {
      setMessage(userErrorMessage(reason, "画像を適用できませんでした。"));
    } finally {
      setBusy(false);
    }
  }
  const history = preview ? [preview, ...assets] : assets;
  return <div className="evolution-panel"><div className="evolution-actions">{(["child", "learning-partner"] as Stage[]).map(stage => <button className="button outline" type="button" key={stage} disabled={busy || exp < thresholds[stage]} onClick={() => generate(stage)}>{exp < thresholds[stage] ? `${thresholds[stage]} EXPで${labels[stage]}` : `${labels[stage]}画像を生成`}</button>)}</div>{busy && <p className="notice">AIが成長後のデザインと画像を生成しています…</p>}{message && <p className={message.includes("できません") ? "notice error" : "notice success"}>{message}</p>}<div className="character-asset-grid">{history.map(asset => <article className={`character-asset-card ${asset.isActive ? "active" : ""}`} key={asset.id}><img src={`/api/assets/${asset.visualAssetId}`} alt={`${labels[asset.stage]}のキャラクター画像`} /><div><strong>{labels[asset.stage]}</strong><small>{new Date(asset.createdAt).toLocaleString("ja-JP")}</small></div>{asset.isActive ? <span className="active-label">使用中</span> : <button className="button compact" type="button" disabled={busy || exp < thresholds[asset.stage]} onClick={() => apply(asset)}>この姿を使う</button>}</article>)}</div></div>;
}
