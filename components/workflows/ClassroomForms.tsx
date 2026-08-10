"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateClassroomForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const name = String(new FormData(event.currentTarget).get("name") ?? "");
    const response = await fetch("/api/classrooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "クラスを作成できませんでした。"); setBusy(false); return; }
    event.currentTarget.reset(); setBusy(false); router.refresh();
  }
  return <form onSubmit={submit} className="inline-workflow-form"><label className="field"><span className="field-label">クラス名</span><input name="name" maxLength={100} placeholder="例：2年A組 数学" required /></label><button className="button" disabled={busy}>{busy ? "作成中…" : "クラスを作成"}</button>{error && <p className="notice error">{error}</p>}</form>;
}

export function JoinClassroomForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const joinCode = String(new FormData(event.currentTarget).get("joinCode") ?? "");
    const response = await fetch("/api/classrooms/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ joinCode }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? "クラスに参加できませんでした。"); setBusy(false); return; }
    event.currentTarget.reset(); setMessage("クラスに参加しました。"); setBusy(false); router.refresh();
  }
  return <form onSubmit={submit} className="inline-workflow-form"><label className="field"><span className="field-label">参加コード</span><input name="joinCode" minLength={8} maxLength={10} autoCapitalize="characters" placeholder="8〜10文字" required /></label><button className="button" disabled={busy}>{busy ? "参加中…" : "クラスに参加"}</button>{message && <p className={message.includes("できません") ? "notice error" : "notice success"}>{message}</p>}</form>;
}
