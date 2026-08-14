import type { UserRole } from "./types";

/** 管理者は全ロール向け機能へ入れる。管理者向け機能は引き続き管理者だけに許可する。 */
export function canAccessRoles(currentRole: UserRole, allowedRoles: readonly UserRole[]) {
  return currentRole === "admin" || allowedRoles.includes(currentRole);
}
