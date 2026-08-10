"use client";

import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { AppFooter } from "./AppFooter";
import { AppTopbar } from "./AppTopbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Nav />
      <div className="app-frame">
        <AppTopbar />
        <div className="app-content">{children}</div>
        <AppFooter />
      </div>
    </div>
  );
}
