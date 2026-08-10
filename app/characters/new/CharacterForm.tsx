"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppCard } from "@/components/design-system/AppCard";

const fields = [
  ["name", "名前", "ミント"],
  ["favoriteColor", "好きな色", "みどり・オレンジ"],
  ["personality", "性格", "好奇心旺盛でやさしい"],
  ["motif", "モチーフ", "森と星"],
  ["likes", "好きなもの", "本と探検"],
  ["mood", "雰囲気", "まるくて親しみやすい"],
] as const;

export function CharacterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/characters/design", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "キャラクターを作成できませんでした");
      router.push("/characters");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "キャラクターを作成できませんでした");
      setBusy(false);
    }
  }
  return <AppCard as="form" className="form-section" onSubmit={submit}><div className="form-grid">{fields.map(([name, label, value]) => <label className="field" key={name}><span>{label}</span><input name={name} defaultValue={value} required /></label>)}<label className="field full"><span>自由な要望</span><textarea name="request" defaultValue="怖くない、シンプルな学習パートナー" /><small>見た目や雰囲気について追加の希望を入力できます。</small></label></div>{error && <p className="notice error" role="alert">{error}</p>}<button className="button" type="submit" disabled={busy}><Sparkles aria-hidden="true" size={18} />{busy ? "作成中…" : "デザインとタマゴを作る"}</button></AppCard>;
}
