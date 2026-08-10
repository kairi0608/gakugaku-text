"use client";

import { BookOpenCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { experienceRoleDescriptions, experienceRoleLabels, mobileNavigationByRole, navigationByRole, type ExperienceNavigationItem, type ExperienceRole } from "@/config/navigation";

function isActive(pathname: string, item: ExperienceNavigationItem) {
  const paths = item.matchPaths ?? [item.href.split("?")[0]];
  return paths.some(path => pathname === path || pathname.startsWith(`${path}/`));
}

function NavigationItems({ role, mobile = false }: { role: ExperienceRole; mobile?: boolean }) {
  const pathname = usePathname();
  const items = mobile ? mobileNavigationByRole[role] : navigationByRole[role];
  return <>{items.map(({ href, label, icon: Icon, matchPaths }) => {
    const active = isActive(pathname, { href, label, icon: Icon, matchPaths });
    return <Link key={`${role}-${href}`} href={href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}><Icon aria-hidden="true" size={mobile ? 20 : 19} /><span>{label}</span></Link>;
  })}</>;
}

export function RoleNavigation({ role }: { role: ExperienceRole }) {
  return <>
    <aside className="app-sidebar" data-experience-role={role}>
      <Link className="brand" href={`/${role}`} aria-label={`${experienceRoleLabels[role]}ページ ホーム`}><span className="brand-mark"><BookOpenCheck aria-hidden="true" size={22} /></span><span>ガクガクAIシステム</span></Link>
      <div className="role-chip"><span>{experienceRoleLabels[role]}ページ</span><small>利用モード</small></div>
      <nav className="sidebar-nav" aria-label={`${experienceRoleLabels[role]}ページのナビゲーション`}><NavigationItems role={role} /></nav>
      <div className="sidebar-note"><p>{experienceRoleDescriptions[role]}</p><Link href="/"><UsersRound aria-hidden="true" size={14} />利用方法を変更</Link></div>
    </aside>
    <nav className="mobile-bottom-nav" aria-label={`${experienceRoleLabels[role]}ページのモバイルナビゲーション`}><NavigationItems role={role} mobile /></nav>
  </>;
}
