export const userRoles = ["personal", "student", "teacher", "admin"] as const;
export type UserRole = typeof userRoles[number];
export function roleHome(role: UserRole) { return `/${role}`; }
export function canManageClassrooms(role: UserRole) { return role === "teacher" || role === "admin"; }
