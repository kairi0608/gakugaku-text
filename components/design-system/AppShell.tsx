"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { experienceRoleFromPath, parseExperienceRole } from "@/config/navigation";
import { RoleNavigation } from "@/components/navigation/RoleNavigation";
import { RoleTopbar } from "@/components/navigation/RoleTopbar";
import { SimpleHeader } from "@/components/navigation/SimpleHeader";
import { AppFooter } from "./AppFooter";

const publicRoutes = new Set(["/", "/privacy", "/terms"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPublic = publicRoutes.has(pathname);
  const role = experienceRoleFromPath(pathname) ?? parseExperienceRole(searchParams.get("from")) ?? "personal";

  if (isPublic) return <div className="app-shell public-shell"><SimpleHeader /><div className="public-frame"><div className="app-content">{children}</div><AppFooter /></div></div>;

  return <div className="app-shell"><RoleNavigation role={role} /><div className="app-frame"><RoleTopbar role={role} /><div className="app-content">{children}</div><AppFooter /></div></div>;
}
