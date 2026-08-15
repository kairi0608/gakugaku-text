import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AppShell } from "@/components/design-system/AppShell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: { default: "ガクガクAIシステム", template: "%s | ガクガクAIシステム" },
  description: "AI教材、学習履歴、キャラクター成長、クラス課題をつなぐ学習システム",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const current = isSupabaseConfigured() ? await getCurrentUser().catch(error => {
    console.error("[shell] initial account lookup failed", error instanceof Error ? error.name : "unknown_error");
    return null;
  }) : null;
  const initialAccount = current ? { role: current.profile.role, gradeBand: current.profile.gradeBand } : null;
  return <html lang="ja"><body><Suspense fallback={<div className="app-loading-shell" role="status">画面を読み込んでいます…</div>}><AppShell initialAccount={initialAccount}>{children}</AppShell></Suspense></body></html>;
}
