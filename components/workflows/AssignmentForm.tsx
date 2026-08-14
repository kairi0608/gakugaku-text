"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson, userErrorMessage } from "@/lib/http/client-json";

type Option = { id: string; label: string };

export function AssignmentForm({ classrooms, versions }: { classrooms: Option[]; versions: Option[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const dueValue = String(form.get("dueAt") ?? "");
    const body = { classroomId: form.get("classroomId"), materialVersionId: form.get("materialVersionId"), title: form.get("title"), instructions: form.get("instructions") ?? "", dueAt: dueValue ? new Date(dueValue).toISOString() : null, publish: form.get("publish") === "on" };
    try {
      await requestJson("/api/assignments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }, "課題を作成できませんでした。");
      formElement.reset(); router.refresh();
    } catch (reason) {
      setError(userErrorMessage(reason, "課題を作成できませんでした。"));
    } finally {
      setBusy(false);
    }
  }
  if (!classrooms.length || !versions.length) return <p className="notice">課題を作るには、クラスと公開済み教材の両方が必要です。</p>;
  return <form onSubmit={submit} className="workflow-form" aria-busy={busy}><div className="form-grid"><label className="field"><span>クラス</span><select name="classroomId" disabled={busy}>{classrooms.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><label className="field"><span>配布する教材バージョン</span><select name="materialVersionId" disabled={busy}>{versions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><label className="field"><span>課題名</span><input name="title" maxLength={160} required disabled={busy} /></label><label className="field"><span>締切</span><input name="dueAt" type="datetime-local" disabled={busy} /></label><label className="field full"><span>指示</span><textarea name="instructions" maxLength={4000} disabled={busy} /></label></div><label className="choice"><input name="publish" type="checkbox" defaultChecked disabled={busy} /><span>作成と同時に生徒へ公開する</span></label><button className="button" disabled={busy}>{busy ? "保存中…" : "課題を作成"}</button>{error && <p className="notice error" role="alert">{error}</p>}</form>;
}
