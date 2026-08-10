"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; label: string };

export function AssignmentForm({ classrooms, versions }: { classrooms: Option[]; versions: Option[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const dueValue = String(form.get("dueAt") ?? "");
    const body = { classroomId: form.get("classroomId"), materialVersionId: form.get("materialVersionId"), title: form.get("title"), instructions: form.get("instructions") ?? "", dueAt: dueValue ? new Date(dueValue).toISOString() : null, publish: form.get("publish") === "on" };
    const response = await fetch("/api/assignments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "課題を作成できませんでした。"); setBusy(false); return; }
    event.currentTarget.reset(); setBusy(false); router.refresh();
  }
  if (!classrooms.length || !versions.length) return <p className="notice">課題を作るには、クラスと公開済み教材の両方が必要です。</p>;
  return <form onSubmit={submit} className="workflow-form"><div className="form-grid"><label className="field"><span>クラス</span><select name="classroomId">{classrooms.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><label className="field"><span>配布する教材バージョン</span><select name="materialVersionId">{versions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><label className="field"><span>課題名</span><input name="title" maxLength={160} required /></label><label className="field"><span>締切</span><input name="dueAt" type="datetime-local" /></label><label className="field full"><span>指示</span><textarea name="instructions" maxLength={4000} /></label></div><label className="choice"><input name="publish" type="checkbox" defaultChecked /><span>作成と同時に生徒へ公開する</span></label><button className="button" disabled={busy}>{busy ? "保存中…" : "課題を作成"}</button>{error && <p className="notice error">{error}</p>}</form>;
}
