"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SpecialEventForm({ classrooms }: { classrooms: Array<{ id: string; name: string }> }) {
  const router = useRouter(); const [source, setSource] = useState<"ai" | "teacher">("ai"); const [trigger, setTrigger] = useState<"schedule" | "login-streak">("schedule"); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const raw = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/teacher/special-events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: raw.title, classroomId: raw.classroomId, startAt: new Date(String(raw.startAt)).toISOString(), endAt: raw.endAt ? new Date(String(raw.endAt)).toISOString() : null, triggerType: trigger, streakDays: Number(raw.streakDays ?? 7), source, question: raw.question || undefined, presentationFamily: raw.presentationFamily, enabled: true }) });
      const value = await response.json().catch(() => ({})); if (!response.ok) throw new Error(value.error ?? "作成できませんでした。"); event.currentTarget.reset(); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "作成できませんでした。"); } finally { setBusy(false); }
  }
  if (!classrooms.length) return <p className="notice warning">先に担当クラスを作成してください。</p>;
  return <form className="special-event-form" onSubmit={submit}><div className="form-grid"><label className="field"><span>イベント名</span><input name="title" maxLength={160} required placeholder="7日連続ログイン記念" /></label><label className="field"><span>対象クラス</span><select name="classroomId" required>{classrooms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field"><span>開始</span><input name="startAt" type="datetime-local" required /></label><label className="field"><span>終了（任意）</span><input name="endAt" type="datetime-local" /></label><label className="field"><span>出現条件</span><select value={trigger} onChange={event => setTrigger(event.target.value as typeof trigger)}><option value="schedule">指定期間</option><option value="login-streak">連続ログイン</option></select></label>{trigger === "login-streak" && <label className="field"><span>必要な連続日数</span><input name="streakDays" type="number" min="2" max="365" defaultValue="7" required /></label>}<label className="field"><span>作り方</span><select value={source} onChange={event => setSource(event.target.value as typeof source)}><option value="ai">AIで生成</option><option value="teacher">教師が作成</option></select></label><label className="field"><span>見せ方</span><select name="presentationFamily" defaultValue="illustration"><option value="illustration">イラスト・アニメ</option><option value="real">図鑑・リアル</option></select></label></div><label className="field"><span>{source === "teacher" ? "What Ifの問い" : "AIへのテーマ指定（任意）"}</span><textarea name="question" required={source === "teacher"} maxLength={1400} placeholder="もし重力が半分になったら、学校生活はどう変わる？" /></label><p className="caption">AI生成は1イベントにつき1回です。生徒の回答には短いフィードバックだけを返します。</p><button className="button" disabled={busy}><Sparkles aria-hidden="true" size={17} />{busy ? "作成・検証中…" : "イベントを作成"}</button>{error && <p className="notice error" role="alert">{error}</p>}</form>;
}

export function EventToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  async function toggle() { setBusy(true); try { const response = await fetch(`/api/teacher/special-events/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: !enabled }) }); if (!response.ok) throw new Error(); router.refresh(); } finally { setBusy(false); } }
  return <button className="button outline" type="button" disabled={busy} onClick={toggle}>{enabled ? "停止する" : "有効にする"}</button>;
}
