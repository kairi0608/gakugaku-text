import type { UserRole } from "./types";

/** Administrators can use every role-scoped feature; standard roles stay isolated. */
export function canAccessRoles(currentRole: UserRole, allowedRoles: readonly UserRole[]) {
  return currentRole === "admin" || allowedRoles.includes(currentRole);
}
