"use client";

import { useState } from "react";
import { InterestCards, PresentationCards } from "@/components/learning/PreferenceCards";
import type { InterestCategory, PresentationFamily } from "@/features/learning-session/shared/types";

export function LearningPreferenceForm({ initialPresentation, initialInterest }: { initialPresentation: PresentationFamily; initialInterest: InterestCategory }) {
  const [presentation, setPresentation] = useState(initialPresentation); const [interest, setInterest] = useState(initialInterest); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function save() { setBusy(true); setMessage(""); setError(""); try { const response = await fetch("/api/preferences", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ presentationFamily: presentation, interestCategory: interest, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }) }); const value = await response.json().catch(() => ({})); if (!response.ok) throw new Error(value.error ?? "保存できませんでした。"); setMessage("次回の自主学習の初期値として保存しました。"); } catch (reason) { setError(reason instanceof Error ? reason.message : "保存できませんでした。"); } finally { setBusy(false); } }
  return <div className="learning-preference-form"><h3>見せ方</h3><PresentationCards value={presentation} onChange={setPresentation} /><h3>興味のテーマ</h3><InterestCards value={interest} onChange={setInterest} /><button className="button" type="button" onClick={save} disabled={busy}>{busy ? "保存中…" : "学習の好みを保存"}</button>{message && <p className="notice success">{message}</p>}{error && <p className="notice error" role="alert">{error}</p>}</div>;
}
