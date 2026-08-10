export const userRoles = ["personal", "student", "teacher", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const gradeBands = ["elementary", "middle", "high", "other"] as const;
export type GradeBand = (typeof gradeBands)[number];

export type Profile = {
  id: string;
  role: UserRole;
  displayName: string;
  gradeBand: GradeBand | null;
  createdAt: string;
  updatedAt: string;
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function roleDashboard(role: UserRole) {
  return `/${role}`;
}
