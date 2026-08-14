"use client";

import { useFormStatus } from "react-dom";

export function AuthSubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <button className="button auth-submit" type="submit" disabled={pending} aria-busy={pending}>{pending ? pendingLabel : idleLabel}</button>;
}
