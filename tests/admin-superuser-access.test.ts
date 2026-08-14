import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { navigationByRole } from "../config/navigation";
import { canAccessRoles } from "../lib/auth/access";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("administrator superuser access", () => {
  it("allows an administrator through every standard role guard", () => {
    expect(canAccessRoles("admin", ["personal"])).toBe(true);
    expect(canAccessRoles("admin", ["student"])).toBe(true);
    expect(canAccessRoles("admin", ["teacher"])).toBe(true);
    expect(canAccessRoles("admin", ["admin"])).toBe(true);
  });

  it("does not grant administrator-only pages to standard roles", () => {
    expect(canAccessRoles("personal", ["admin"])).toBe(false);
    expect(canAccessRoles("student", ["admin"])).toBe(false);
    expect(canAccessRoles("teacher", ["admin"])).toBe(false);
    expect(canAccessRoles("teacher", ["teacher"])).toBe(true);
  });

  it("uses the shared rule in middleware, page guards, API guards, and assignment access", () => {
    expect(source("../middleware.ts")).toContain("canAccessRoles(profile.role");
    expect(source("../lib/auth/require-role.ts")).toContain("canAccessRoles(current.profile.role");
    expect(source("../app/learn/[id]/page.tsx")).toContain('canAccessRoles(current.profile.role, ["student"])');
    expect(source("../app/api/attempts/submit/route.ts")).toContain('canAccessRoles(current.profile.role, ["student"])');
  });

  it("provides direct navigation to normal and administrator pages", () => {
    const hrefs = navigationByRole.admin.map(item => item.href.split("?")[0]);
    expect(hrefs).toEqual(expect.arrayContaining([
      "/admin",
      "/admin/users",
      "/admin/generations",
      "/admin/system",
      "/personal",
      "/student",
      "/teacher",
      "/settings",
    ]));
    const dashboard = source("../app/admin/page.tsx");
    for (const path of ["/personal", "/student/assignments", "/teacher/classrooms", "/teacher/assignments", "/teacher/submissions"]) {
      expect(dashboard).toContain(path);
    }
  });
});
