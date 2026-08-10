import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return <main className="auth-page"><section className="auth-card"><Link href="/" className="auth-brand"><span className="brand-mark">G</span><span>ガクガクAIシステム</span></Link><div className="auth-heading"><h1>{title}</h1><p>{description}</p></div>{children}{footer && <div className="auth-card-footer">{footer}</div>}</section></main>;
}

export function AuthNotice({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return <p className={`notice ${error ? "error" : "success"}`} role="status">{error ?? message}</p>;
}
