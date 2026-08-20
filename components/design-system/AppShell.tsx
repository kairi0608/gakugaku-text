"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RoleNavigation } from "@/components/navigation/RoleNavigation";
import { RoleTopbar } from "@/components/navigation/RoleTopbar";
import { SimpleHeader } from "@/components/navigation/SimpleHeader";
import { AppFooter } from "./AppFooter";
import { BackgroundLayer } from "@/components/appearance/BackgroundLayer";
import type { GradeBand, UserRole } from "@/lib/auth/types";

const publicRoutes = new Set(["/", "/privacy", "/terms"]);
export type ShellAccount = { role: UserRole; gradeBand: GradeBand | null };

export function AppShell({ children, initialAccount }: { children: ReactNode; initialAccount: ShellAccount | null }) {
  const pathname = usePathname();
  const isPublic = publicRoutes.has(pathname) || pathname.startsWith("/auth/");
  const isPrintRoute = /^\/materials\/[^/]+\/print$/.test(pathname);
  const [account, setAccount] = useState<ShellAccount | null>(initialAccount);
  useEffect(() => {
    if (isPublic || initialAccount) return;
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(value => { if (active && value?.role) setAccount(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [initialAccount, isPublic]);

  if (isPrintRoute) return <div className="print-route-shell">{children}</div>;
  if (isPublic) return <div className="app-shell public-shell"><SimpleHeader /><div className="public-frame"><div className="app-content">{children}</div><AppFooter /></div></div>;
  if (!account) return <div className="app-shell"><div className="app-loading-shell" role="status">アカウントを確認しています…</div></div>;

  return <div className="app-shell"><BackgroundLayer /><RoleNavigation role={account.role} gradeBand={account.gradeBand} /><div className="app-frame"><RoleTopbar role={account.role} gradeBand={account.gradeBand} /><div className="app-content">{children}</div><AppFooter /></div></div>;
}
