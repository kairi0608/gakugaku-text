"use client";

import { useEffect, useState } from "react";
import type { DailyMood } from "@/features/learning-session/shared/types";

const moods: Array<{ value: DailyMood; face: string; label: string }> = [
  { value: "very-good", face: "😄", label: "とても元気" },
  { value: "good", face: "🙂", label: "元気" },
  { value: "neutral", face: "😌", label: "いつも通り" },
  { value: "tired", face: "😴", label: "少し疲れた" },
  { value: "low", face: "🌱", label: "ゆっくり" },
];

export function DailyMoodCheck({ localDate, initialMood }: { localDate: string; initialMood?: DailyMood | null }) {
  const [visible, setVisible] = useState(!initialMood);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (window.localStorage.getItem(`gakugaku-mood-later:${localDate}`)) setVisible(false); }, [localDate]);
  if (!visible) return null;
  async function choose(mood: DailyMood) {
    setBusy(true); setError("");
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo";
      const response = await fetch("/api/mood", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mood, timezone }) });
      if (!response.ok) throw new Error("気分を保存できませんでした。学習はそのまま始められます。");
      setVisible(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "保存できませんでした。"); } finally { setBusy(false); }
  }
  function later() { window.localStorage.setItem(`gakugaku-mood-later:${localDate}`, "1"); setVisible(false); }
  return <section className="daily-mood-card" aria-labelledby="daily-mood-title"><div><p className="eyebrow">今日のチェックイン</p><h2 id="daily-mood-title">今日の気分は？</h2><p>問題の長さや進め方を少しだけ調整します。</p></div><div className="mood-options">{moods.map(item => <button type="button" disabled={busy} key={item.value} onClick={() => choose(item.value)}><span aria-hidden="true">{item.face}</span><strong>{item.label}</strong></button>)}</div><button className="button outline mood-later" type="button" disabled={busy} onClick={later}>あとで</button>{error && <p className="notice warning" role="status">{error}</p>}</section>;
}
