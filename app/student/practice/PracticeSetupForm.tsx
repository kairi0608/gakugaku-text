"use client";

import { Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InterestCards, PresentationCards } from "@/components/learning/PreferenceCards";
import type { DailyMood, InterestCategory, PresentationFamily } from "@/features/learning-session/shared/types";

export function PracticeSetupForm({ initialPresentation, initialInterest, mood }: { initialPresentation: PresentationFamily; initialInterest: InterestCategory; mood: DailyMood | null }) {
  const router = useRouter();
  const [presentation, setPresentation] = useState(initialPresentation);
  const [interest, setInterest] = useState(initialInterest);
  const [count, setCount] = useState<3 | 5 | 10>(mood === "low" || mood === "tired" ? 3 : 5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const preferenceResponse = await fetch("/api/preferences", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ presentationFamily: presentation, interestCategory: interest, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
      if (!preferenceResponse.ok) throw new Error("見せ方の設定を保存できませんでした。");
      const response = await fetch("/api/learning-sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "self-practice", subject: data.get("subject"), unit: data.get("unit"), difficulty: "standard", targetQuestionCount: count, feedbackMode: "after-set", presentationFamily: presentation, interestCategory: interest, mood }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "自主チャレンジを開始できませんでした。");
      router.push(`/student/practice/${body.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "開始できませんでした。"); setBusy(false); }
  }
  return <form className="practice-setup" onSubmit={start} aria-busy={busy}>
    <section><p className="step-label">1</p><h2>何を練習する？</h2><div className="form-grid"><label className="field"><span>教科</span><select name="subject" defaultValue="算数"><option>算数</option><option>国語</option><option>理科</option><option>社会</option><option>英語</option></select></label><label className="field"><span>単元</span><input name="unit" defaultValue="わり算" maxLength={160} required /></label></div></section>
    <section><p className="step-label">2</p><h2>どんな世界で学ぶ？</h2><InterestCards value={interest} onChange={setInterest} /></section>
    <section><p className="step-label">3</p><h2>見せ方を選ぶ</h2><PresentationCards value={presentation} onChange={setPresentation} /><p className="caption">「図鑑・リアル」のAI画像は図解として表示します。実際の写真は先生が登録した写真だけを写真として扱います。</p></section>
    <section><p className="step-label">4</p><h2>何問チャレンジする？</h2><div className="question-count-options">{([3,5,10] as const).map(value => <button type="button" className={count === value ? "selected" : ""} aria-pressed={count === value} key={value} onClick={() => setCount(value)}><strong>{value}</strong><span>問</span></button>)}</div>{(mood === "low" || mood === "tired") && <p className="caption">今日は3問から始める設定にしています。好きな数へ変更できます。</p>}</section>
    {error && <p className="notice error" role="alert">{error}</p>}
    <button className="button game-start-button" disabled={busy}><Rocket aria-hidden="true" size={20} />{busy ? "GAMEを準備しています…" : "GAME START"}</button>
  </form>;
}
