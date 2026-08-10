import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/design-system/AppShell";

export const metadata: Metadata = {
  title: { default: "ガクガクAIシステム", template: "%s | ガクガクAIシステム" },
  description: "AIとともに教材をつくり、学び、成長を記録できる学習システム",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body><AppShell>{children}</AppShell></body></html>;
}
