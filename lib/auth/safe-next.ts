import { roleDashboard, type UserRole } from "./types";

export function safeRoleNext(value: unknown, role: UserRole) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;

  try {
    const parsed = new URL(value, "https://gakugaku.invalid");
    const roleRoot = roleDashboard(role);
    if (parsed.pathname !== roleRoot && !parsed.pathname.startsWith(`${roleRoot}/`)) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
