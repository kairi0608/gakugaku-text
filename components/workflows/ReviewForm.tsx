"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson, userErrorMessage } from "@/lib/http/client-json";

export function ReviewForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const scoreRaw = String(form.get("score") ?? "");
    try {
      await requestJson(`/api/submissions/${submissionId}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ feedback: form.get("feedback"), score: scoreRaw ? Number(scoreRaw) : null }) }, "確認結果を保存できませんでした。");
      router.refresh();
    } catch (reason) {
      setError(userErrorMessage(reason, "確認結果を保存できませんでした。"));
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="review-form"><label className="field"><span>得点（任意）</span><input name="score" type="number" min="0" max="100" /></label><label className="field"><span>先生からのフィードバック</span><textarea name="feedback" maxLength={5000} required /></label><button className="button" disabled={busy}>{busy ? "保存中…" : "確認を完了"}</button>{error && <p className="notice error">{error}</p>}</form>;
}
