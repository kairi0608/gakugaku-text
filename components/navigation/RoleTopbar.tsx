"use client";

import { BookOpenCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { experienceRoleDescriptions, experienceRoleLabels, navigationByRole, type ExperienceRole } from "@/config/navigation";
import { logoutAction } from "@/app/auth/actions";
import { studentNavigationLabels, studentStageFromGradeBand } from "@/config/student-experience";
import type { GradeBand } from "@/lib/auth/types";

export function RoleTopbar({ role, gradeBand }: { role: ExperienceRole; gradeBand?: GradeBand | null }) {
  const pathname = usePathname();
  const item = navigationByRole[role].find(candidate => (candidate.matchPaths ?? [candidate.href.split("?")[0]]).some(path => pathname === path || pathname.startsWith(`${path}/`)));
  const studentIndex = role === "student" && item ? navigationByRole.student.findIndex(candidate => candidate.href === item.href) : -1;
  const title = studentIndex >= 0 ? studentNavigationLabels[studentStageFromGradeBand(gradeBand)][studentIndex] ?? item?.label : item?.label ?? experienceRoleLabels[role];
  return <header className="app-topbar"><div className="mobile-brand" aria-label="ガクガクAIシステム"><span className="brand-mark"><BookOpenCheck aria-hidden="true" size={20} /></span><strong>ガクガクAI</strong></div><p className="topbar-title">{title}</p><span className="topbar-caption">{experienceRoleDescriptions[role]}</span><form action={logoutAction}><LogoutButton /></form></header>;
}

function LogoutButton() {
  const { pending } = useFormStatus();
  return <button className="topbar-logout" type="submit" disabled={pending} aria-busy={pending}>{pending ? "ログアウト中…" : "ログアウト"}</button>;
}
