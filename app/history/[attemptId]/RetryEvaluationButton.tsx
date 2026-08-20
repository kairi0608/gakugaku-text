"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetryEvaluationButton({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function retry() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/attempts/${attemptId}/evaluate`, { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "再評価できませんでした。");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "再評価できませんでした。");
    } finally {
      setBusy(false);
    }
  }
  return <div className="retry-evaluation"><button className="button outline" type="button" disabled={busy} onClick={retry}><RefreshCw aria-hidden="true" size={17} />{busy ? "AIが確認しています…" : "AIフィードバックを再取得"}</button>{error && <p className="error-text" role="alert">{error}</p>}</div>;
}
