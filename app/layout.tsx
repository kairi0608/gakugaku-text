import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AppShell } from "@/components/design-system/AppShell";

export const metadata: Metadata = {
  title: { default: "ガクガクAIシステム", template: "%s | ガクガクAIシステム" },
  description: "AI教材、学習履歴、キャラクター成長、クラス課題をつなぐ学習システム",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body><Suspense fallback={<div className="app-loading-shell">{children}</div>}><AppShell>{children}</AppShell></Suspense></body></html>;
}
