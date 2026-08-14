"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/auth/types";
import { requestJson, userErrorMessage } from "@/lib/http/client-json";

export function RoleChangeForm({ userId, role }: { userId: string; role: UserRole }) {
  const router = useRouter(); const [value, setValue] = useState(role); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function save() {
    setBusy(true); setError("");
    try {
      await requestJson(`/api/admin/users/${userId}/role`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: value }) }, "ロールを更新できませんでした。");
      router.refresh();
    } catch (reason) {
      setError(userErrorMessage(reason, "ロールを更新できませんでした。"));
    } finally {
      setBusy(false);
    }
  }
  return <div className="role-editor"><select value={value} onChange={event => setValue(event.target.value as UserRole)} aria-label="ロール" disabled={busy}><option value="personal">個人</option><option value="student">生徒</option><option value="teacher">教師</option><option value="admin">管理者</option></select><button className="button outline compact" type="button" onClick={save} disabled={busy || value === role} aria-busy={busy}>{busy ? "更新中…" : "更新"}</button>{error && <small className="error-text" role="alert">{error}</small>}</div>;
}
