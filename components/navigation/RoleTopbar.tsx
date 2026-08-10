"use client";

import { BookOpenCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { experienceRoleDescriptions, experienceRoleLabels, navigationByRole, type ExperienceRole } from "@/config/navigation";

export function RoleTopbar({ role }: { role: ExperienceRole }) {
  const pathname = usePathname();
  const item = navigationByRole[role].find(candidate => (candidate.matchPaths ?? [candidate.href.split("?")[0]]).some(path => pathname === path || pathname.startsWith(`${path}/`)));
  const title = item?.label ?? experienceRoleLabels[role];
  return <header className="app-topbar"><div className="mobile-brand" aria-label="ガクガクAIシステム"><span className="brand-mark"><BookOpenCheck aria-hidden="true" size={20} /></span><strong>ガクガクAIシステム</strong></div><p className="topbar-title">{title}</p><span className="topbar-caption">{experienceRoleDescriptions[role]}</span></header>;
}
