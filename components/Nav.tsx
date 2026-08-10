"use client";

import { BookOpenCheck, Clock3, FilePlus2, GraduationCap, Home, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/create", label: "教材作成", icon: FilePlus2 },
  { href: "/materials", label: "学習", icon: GraduationCap },
  { href: "/history", label: "履歴", icon: Clock3 },
  { href: "/characters", label: "キャラクター", icon: Sparkles },
  { href: "/settings", label: "設定", icon: Settings },
];

const mobileNavigation = navigation.filter(({ href }) => href !== "/characters");

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/materials" && pathname.startsWith("/learn/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationItems({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const items = mobile ? mobileNavigation : navigation;
  return <>{items.map(({ href, label, icon: Icon }) => {
    const active = isActive(pathname, href);
    return (
      <Link key={href} href={href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
        <Icon aria-hidden="true" size={mobile ? 20 : 19} />
        <span>{label}</span>
      </Link>
    );
  })}</>;
}

export function Nav() {
  return (
    <>
      <aside className="app-sidebar">
        <Link className="brand" href="/" aria-label="ガクガクAIシステム ホーム">
          <span className="brand-mark"><BookOpenCheck aria-hidden="true" size={22} /></span>
          <span>ガクガクAIシステム</span>
        </Link>
        <nav className="sidebar-nav" aria-label="メインナビゲーション"><NavigationItems /></nav>
        <p className="sidebar-note">一人ひとりの学びを、AIがサポート。</p>
      </aside>
      <nav className="mobile-bottom-nav" aria-label="モバイルナビゲーション"><NavigationItems mobile /></nav>
    </>
  );
}
