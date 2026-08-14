"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson, userErrorMessage } from "@/lib/http/client-json";

export function CreateClassroomForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const formElement = event.currentTarget;
    const name = String(new FormData(formElement).get("name") ?? "");
    try {
      await requestJson("/api/classrooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }, "クラスを作成できませんでした。");
      formElement.reset(); router.refresh();
    } catch (reason) {
      setError(userErrorMessage(reason, "クラスを作成できませんでした。"));
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="inline-workflow-form" aria-busy={busy}><label className="field"><span className="field-label">クラス名</span><input name="name" maxLength={100} placeholder="例：2年A組 数学" required disabled={busy} /></label><button className="button" disabled={busy}>{busy ? "作成中…" : "クラスを作成"}</button>{error && <p className="notice error" role="alert">{error}</p>}</form>;
}

export function JoinClassroomForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const formElement = event.currentTarget;
    const joinCode = String(new FormData(formElement).get("joinCode") ?? "");
    try {
      await requestJson("/api/classrooms/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ joinCode }) }, "クラスに参加できませんでした。");
      formElement.reset(); setMessage("クラスに参加しました。"); router.refresh();
    } catch (reason) {
      setMessage(userErrorMessage(reason, "クラスに参加できませんでした。"));
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="inline-workflow-form" aria-busy={busy}><label className="field"><span className="field-label">参加コード</span><input name="joinCode" minLength={8} maxLength={10} autoCapitalize="characters" placeholder="8〜10文字" required disabled={busy} /></label><button className="button" disabled={busy}>{busy ? "参加中…" : "クラスに参加"}</button>{message && <p className={message.includes("できません") ? "notice error" : "notice success"} role="status">{message}</p>}</form>;
}
