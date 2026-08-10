"use client";

import { useFormStatus } from "react-dom";
import { resendSignupConfirmationAction } from "../actions";

function ResendButton() {
  const { pending } = useFormStatus();
  return <button className="button auth-submit" type="submit" disabled={pending}>{pending ? "再送中…" : "確認メールを再送"}</button>;
}

export function ResendConfirmationForm() {
  return <form action={resendSignupConfirmationAction} className="auth-form"><label className="field"><span className="field-label">登録したメールアドレス</span><input name="email" type="email" autoComplete="email" required /></label><ResendButton /></form>;
}

