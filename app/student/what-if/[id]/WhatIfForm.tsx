"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { AppCard } from "@/components/design-system/AppCard";

type Feedback = { response: string; scientificNote: string | null };
export function WhatIfForm({ eventId }: { eventId: string }) {
  const [answer, setAnswer] = useState(""); const [feedback, setFeedback] = useState<Feedback | null>(null); const [exp, setExp] = useState(0); const [source, setSource] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { const response = await fetch(`/api/what-if/${eventId}/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answer }) }); const value = await response.json().catch(() => ({})); if (!response.ok) throw new Error(value.error ?? "保存できませんでした。"); setFeedback(value.feedback); setExp(Number(value.expAwarded ?? 0)); setSource(value.feedbackSource ?? (value.resumed ? "saved" : "ai")); } catch (reason) { setError(reason instanceof Error ? reason.message : "保存できませんでした。"); } finally { setBusy(false); } }
  if (feedback) return <AppCard className="what-if-feedback"><Sparkles aria-hidden="true" size={32} /><p className="eyebrow">YOUR HYPOTHESIS</p><h2>考えを保存しました</h2><p>{feedback.response}</p>{feedback.scientificNote && <p className="notice info">科学のメモ: {feedback.scientificNote}</p>}<strong className="exp-earned">+{exp} EXP</strong>{source === "system-fallback" && <p className="caption">AIの応答を取得できなかったため、安全な定型コメントを表示しています。回答は保存されています。</p>}</AppCard>;
  return <form onSubmit={submit}><label className="field"><span>あなたはどうなると思う？</span><textarea value={answer} onChange={event => setAnswer(event.target.value)} maxLength={5000} required placeholder="理由や、起こりそうなことを自由に書こう" rows={8} /></label><button className="button" disabled={busy || !answer.trim()}>{busy ? "考えを保存中…" : "仮説を送る"}</button>{error && <p className="notice error" role="alert">{error}</p>}</form>;
}
