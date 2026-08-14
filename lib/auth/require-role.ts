import "server-only";

import { redirect } from "next/navigation";
import { canAccessRoles } from "./access";
import { getCurrentUser, type CurrentUser } from "./get-current-user";
import { roleDashboard, type UserRole } from "./types";

export class AuthenticationError extends Error {
  readonly status = 401;
}

export class AuthorizationError extends Error {
  readonly status = 403;
}

export async function requireUser(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");
  return current;
}

export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const current = await requireUser();
  if (!canAccessRoles(current.profile.role, [role])) redirect(roleDashboard(current.profile.role));
  return current;
}

export async function requireAnyRole(roles: readonly UserRole[]): Promise<CurrentUser> {
  const current = await requireUser();
  if (!canAccessRoles(current.profile.role, roles)) redirect(roleDashboard(current.profile.role));
  return current;
}

export async function requireApiUser(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) throw new AuthenticationError("ログインが必要です。");
  return current;
}

export async function requireApiRole(roles: readonly UserRole[]): Promise<CurrentUser> {
  const current = await requireApiUser();
  if (!canAccessRoles(current.profile.role, roles)) throw new AuthorizationError("この操作を行う権限がありません。");
  return current;
}
