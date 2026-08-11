import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AppUrlConfigurationError, getAppUrl } from "../lib/auth/app-url";
import { signupRoleSchema } from "../lib/auth/signup-schema";
import { roleDashboard } from "../lib/auth/types";

const signupUi = readFileSync(new URL("../app/auth/signup/SignupForm.tsx", import.meta.url), "utf8");
const signupActions = readFileSync(new URL("../app/auth/actions.ts", import.meta.url), "utf8");
const landingUi = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const callback = readFileSync(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/004_auth_signup_roles_and_email_support.sql", import.meta.url), "utf8");

describe("public signup role schema", () => {
  it.each(["personal", "student", "teacher"])("accepts %s", role => {
    expect(signupRoleSchema.safeParse(role).success).toBe(true);
  });

  it.each(["admin", "unknown"])("rejects %s", role => {
    expect(signupRoleSchema.safeParse(role).success).toBe(false);
  });

  it("uses the shared schema and keeps grade data student-only", () => {
    expect(signupActions).toContain("role: signupRoleSchema");
    expect(signupActions).toContain("requested_role: parsed.data.role");
    expect(signupActions).toContain('parsed.data.role === "student" ? parsed.data.gradeBand ?? "other" : null');
  });
});

describe("migration 004 signup mapping", () => {
  const match = migration.match(/requested_role in \(([^)]+)\)/);
  const allowedRoles = match?.[1].match(/'([^']+)'/g)?.map(value => value.slice(1, -1)) ?? [];
  const mapRequestedRole = (role: string) => allowedRoles.includes(role) ? role : "personal";

  it.each([
    ["personal", "personal"],
    ["student", "student"],
    ["teacher", "teacher"],
    ["admin", "personal"],
    ["unknown", "personal"],
  ])("maps %s to %s", (input, expected) => {
    expect(mapRequestedRole(input)).toBe(expected);
  });

  it("is additive and keeps admin outside the allowlist", () => {
    expect(migration).toContain("create or replace function public.hub_create_profile_for_auth_user()");
    expect(allowedRoles).toEqual(["personal", "student", "teacher"]);
    expect(migration).toContain("if safe_role <> 'student'");
    expect(migration).not.toMatch(/drop\s+table|truncate/i);
  });
});

describe("callback destinations", () => {
  it.each([
    ["personal", "/personal"],
    ["student", "/student"],
    ["teacher", "/teacher"],
    ["admin", "/admin"],
  ] as const)("routes %s to %s", (role, destination) => {
    expect(roleDashboard(role)).toBe(destination);
  });

  it("keeps PKCE exchange and reads the database role", () => {
    expect(callback).toContain("exchangeCodeForSession(code)");
    expect(callback).toContain('.from("profiles").select("role")');
    expect(callback).toContain("roleDashboard(profile.role)");
  });
});

describe("auth UI", () => {
  it("offers personal, student, and teacher but never admin at signup", () => {
    expect(signupUi).toContain('value: "personal"');
    expect(signupUi).toContain('value: "student"');
    expect(signupUi).toContain('value: "teacher"');
    expect(signupUi).not.toContain('value: "admin"');
    expect(signupUi).not.toContain('label: "管理者"');
  });

  it("shows only the three public landing roles", () => {
    for (const title of ["個人", "生徒", "教師"]) expect(landingUi).toContain(`title: "${title}"`);
    expect(landingUi).not.toContain('title: "管理者"');
    expect(landingUi).not.toContain("管理者としてログイン");
    expect(landingUi).not.toContain("ShieldCheck");
    expect(landingUi).toContain('href="/auth/login">ログイン');
  });

  it("allows the email waiting page without a session", () => {
    expect(middleware).toContain('"/auth/check-email"');
  });
});

describe("application URL", () => {
  it("normalizes a configured trailing slash", () => {
    expect(getAppUrl({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "https://example.com/" })).toBe("https://example.com");
  });

  it("uses localhost only in development", () => {
    expect(getAppUrl({ NODE_ENV: "development" })).toBe("http://localhost:3000");
    expect(() => getAppUrl({ NODE_ENV: "production" })).toThrow(AppUrlConfigurationError);
  });
});
