"use client";

import { Archive, CheckCircle2, Pencil, RefreshCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewActions({ materialId, status }: { materialId: string; status: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function action(url: string, body: Record<string, unknown>) {
    setBusy(true); setError("");
    try { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const value = await response.json().catch(() => ({})); if (!response.ok) throw new Error(value.error ?? "保存できませんでした。"); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "保存できませんでした。"); } finally { setBusy(false); }
  }
  return <div className="review-actions-panel"><div className="review-status-line"><strong>現在の状態</strong><span className={`material-review-state ${status}`}>{statusLabel(status)}</span></div><p className="caption">問題・正答・解説・画像・難易度を確認してから承認してください。</p><button className="button" disabled={busy || status === "approved" || status === "published"} onClick={() => action(`/api/materials/${materialId}/approve`, { comment: "内容を確認し授業利用を承認" })}><CheckCircle2 aria-hidden="true" size={17} />承認する</button><button className="button outline" disabled={busy} onClick={() => action(`/api/materials/${materialId}/review`, { action: "decision", decision: "needs_revision", comment: "修正後に再確認" })}><TriangleAlert aria-hidden="true" size={17} />修正が必要</button><Link className="button secondary" href={`/materials/${materialId}/edit?from=teacher`}><Pencil aria-hidden="true" size={17} />編集する</Link><Link className="button outline" href={`/materials/${materialId}?from=teacher`}><RefreshCcw aria-hidden="true" size={17} />再生成・詳細</Link><button className="button danger-button" disabled={busy} onClick={() => action(`/api/materials/${materialId}/review`, { action: "archive" })}><Archive aria-hidden="true" size={17} />アーカイブ</button>{error && <p className="notice error" role="alert">{error}</p>}</div>;
}
function statusLabel(status: string) { return ({ draft: "下書き", reviewing: "確認中", approved: "承認済み", published: "配布済み", archived: "終了" } as Record<string,string>)[status] ?? status; }
