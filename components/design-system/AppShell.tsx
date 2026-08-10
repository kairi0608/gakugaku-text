"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { experienceRoleFromPath, parseExperienceRole } from "@/config/navigation";
import { RoleNavigation } from "@/components/navigation/RoleNavigation";
import { RoleTopbar } from "@/components/navigation/RoleTopbar";
import { SimpleHeader } from "@/components/navigation/SimpleHeader";
import { AppFooter } from "./AppFooter";
import { BackgroundLayer } from "@/components/appearance/BackgroundLayer";
import type { GradeBand, UserRole } from "@/lib/auth/types";

const publicRoutes = new Set(["/", "/privacy", "/terms"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPublic = publicRoutes.has(pathname) || pathname.startsWith("/auth/");
  const inferredRole = experienceRoleFromPath(pathname) ?? parseExperienceRole(searchParams.get("from")) ?? "personal";
  const [account, setAccount] = useState<{ role: UserRole; gradeBand: GradeBand | null } | null>(null);
  useEffect(() => {
    if (isPublic) return;
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(value => { if (active && value?.role) setAccount(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [isPublic]);
  const role = account?.role ?? inferredRole;

  if (isPublic) return <div className="app-shell public-shell"><SimpleHeader /><div className="public-frame"><div className="app-content">{children}</div><AppFooter /></div></div>;

  return <div className="app-shell"><BackgroundLayer /><RoleNavigation role={role} gradeBand={account?.gradeBand} /><div className="app-frame"><RoleTopbar role={role} gradeBand={account?.gradeBand} /><div className="app-content">{children}</div><AppFooter /></div></div>;
}
