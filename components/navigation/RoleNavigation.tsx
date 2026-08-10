"use client";

import { BookOpenCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { experienceRoleDescriptions, experienceRoleLabels, mobileNavigationByRole, navigationByRole, withExperienceRole, type ExperienceNavigationItem, type ExperienceRole } from "@/config/navigation";
import { studentNavigationLabels, studentStageFromGradeBand } from "@/config/student-experience";
import type { GradeBand } from "@/lib/auth/types";

function isActive(pathname: string, item: ExperienceNavigationItem) {
  const paths = item.matchPaths ?? [item.href.split("?")[0]];
  return paths.some(path => pathname === path || pathname.startsWith(`${path}/`));
}

function NavigationItems({ role, gradeBand, mobile = false }: { role: ExperienceRole; gradeBand?: GradeBand | null; mobile?: boolean }) {
  const pathname = usePathname();
  const items = mobile ? mobileNavigationByRole[role] : navigationByRole[role];
  const fullStudentItems = navigationByRole.student;
  const studentLabels = studentNavigationLabels[studentStageFromGradeBand(gradeBand)];
  return <>{items.map(({ href, label, icon: Icon, matchPaths }) => {
    const studentIndex = role === "student" ? fullStudentItems.findIndex(item => item.href === href) : -1;
    const displayLabel = studentIndex >= 0 ? studentLabels[studentIndex] ?? label : label;
    const active = isActive(pathname, { href, label, icon: Icon, matchPaths });
    return <Link key={`${role}-${href}`} href={href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}><Icon aria-hidden="true" size={mobile ? 20 : 19} /><span>{displayLabel}</span></Link>;
  })}</>;
}

export function RoleNavigation({ role, gradeBand }: { role: ExperienceRole; gradeBand?: GradeBand | null }) {
  return <>
    <aside className="app-sidebar" data-experience-role={role}>
      <Link className="brand" href={`/${role}`} aria-label={`${experienceRoleLabels[role]}ページ ホーム`}><span className="brand-mark"><BookOpenCheck aria-hidden="true" size={22} /></span><span>ガクガクAIシステム</span></Link>
      <div className="role-chip"><span>{experienceRoleLabels[role]}ページ</span><small>認証済みロール</small></div>
      <nav className="sidebar-nav" aria-label={`${experienceRoleLabels[role]}ページのナビゲーション`}><NavigationItems role={role} gradeBand={gradeBand} /></nav>
      <div className="sidebar-note"><p>{experienceRoleDescriptions[role]}</p><Link href={withExperienceRole("/settings", role)}><UsersRound aria-hidden="true" size={14} />アカウント設定</Link></div>
    </aside>
    <nav className="mobile-bottom-nav" aria-label={`${experienceRoleLabels[role]}ページのモバイルナビゲーション`}><NavigationItems role={role} gradeBand={gradeBand} mobile /></nav>
  </>;
}
