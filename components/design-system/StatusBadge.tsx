import type { ReactNode } from "react";

export function StatusBadge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "danger" }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}
