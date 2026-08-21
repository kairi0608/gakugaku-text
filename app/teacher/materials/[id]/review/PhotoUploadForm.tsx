"use client";

import { Camera } from "lucide-react";
import { useState } from "react";

export function PhotoUploadForm() {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    try { const response = await fetch("/api/photo-assets", { method: "POST", body: form }); const value = await response.json().catch(() => ({})); if (!response.ok) throw new Error(value.error ?? "保存できませんでした。"); setMessage("実写真として安全に保存しました。教材編集時に使用できます。"); event.currentTarget.reset(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "保存できませんでした。"); } finally { setBusy(false); }
  }
  return <form className="photo-upload-form" onSubmit={upload}><h3><Camera aria-hidden="true" size={18} />実写真を登録</h3><p className="caption">教師が権利を確認した写真だけを登録してください。AI生成画像は実写真として登録できません。</p><label className="field"><span>写真</span><input type="file" name="file" accept="image/png,image/jpeg,image/webp" required disabled={busy} /></label><label className="field"><span>説明</span><input name="description" maxLength={500} placeholder="例: 教室で撮影した植物の葉" /></label><button className="button outline" disabled={busy}>{busy ? "検証・保存中…" : "写真として保存"}</button>{message && <p className="notice success">{message}</p>}{error && <p className="notice error" role="alert">{error}</p>}</form>;
}
