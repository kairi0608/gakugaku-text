"use client";

import { Database, Download } from "lucide-react";
import { useState } from "react";
import { AppCard } from "@/components/design-system/AppCard";

export function BackupPanel() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function backup() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/backup/export", { method: "POST" });
    if (!response.ok) {
      setMessage("バックアップを作成できませんでした。");
      setBusy(false);
      return;
    }
    const blob = await response.blob();
    const anchor = window.document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `gakugaku-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    setMessage("バックアップを保存しました。");
    setBusy(false);
  }
  return <AppCard className="settings-section"><h2><Database aria-hidden="true" size={19} />バックアップ</h2><p className="muted">教材、バージョン、回答履歴、フィードバック、キャラクターをJSON形式で書き出します。</p><div><button className="button outline" type="button" onClick={backup} disabled={busy}><Download aria-hidden="true" size={17} />{busy ? "作成中…" : "JSONをエクスポート"}</button></div>{message && <p className={message.includes("できません") ? "notice error" : "notice"} aria-live="polite">{message}</p>}<p className="caption">復元は誤操作防止のため、Supabase管理者のみ実行できる設計です。</p></AppCard>;
}
