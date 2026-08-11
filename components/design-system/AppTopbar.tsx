"use client";

import { BookOpenCheck } from "lucide-react";
import { usePathname } from "next/navigation";

const routeTitles: Array<[string, string]> = [
  ["/privacy", "プライバシーポリシー"],
  ["/terms", "利用規約"],
  ["/characters/new", "新しいキャラクター"],
  ["/characters", "キャラクター"],
  ["/materials", "学習"],
  ["/learn", "学習"],
  ["/create", "教材作成"],
  ["/history", "履歴"],
  ["/settings", "設定"],
  ["/", "ホーム"],
];

export function AppTopbar() {
  const pathname = usePathname();
  const title = routeTitles.find(([path]) => path === "/" ? pathname === path : pathname.startsWith(path))?.[1] ?? "ガクガクAIシステム";

  return (
    <header className="app-topbar">
      <div className="mobile-brand" aria-label="ガクガクAIシステム">
        <span className="brand-mark"><BookOpenCheck aria-hidden="true" size={20} /></span>
        <strong>ガクガクAI</strong>
      </div>
      <p className="topbar-title">{title}</p>
      <span className="topbar-caption">AIとつくり、学び、成長する</span>
    </header>
  );
}
