import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getEmailDiagnostics } from "../lib/auth/email-diagnostics";
import { authEmailMessages, getAuthEmailMessage } from "../lib/auth/log-auth-error";
import { safeRoleNext } from "../lib/auth/safe-next";

const adminSystem = readFileSync(new URL("../app/admin/system/page.tsx", import.meta.url), "utf8");
const authLogger = readFileSync(new URL("../lib/auth/log-auth-error.ts", import.meta.url), "utf8");

describe("safe post-login destinations", () => {
  it("keeps standard roles under their own root and lets administrators return to every internal page", () => {
    expect(safeRoleNext("/admin/users?tab=roles", "admin")).toBe("/admin/users?tab=roles");
    expect(safeRoleNext("/personal", "admin")).toBe("/personal");
    expect(safeRoleNext("/student/assignments", "admin")).toBe("/student/assignments");
    expect(safeRoleNext("/teacher/classrooms", "admin")).toBe("/teacher/classrooms");
    expect(safeRoleNext("/student/assignments", "student")).toBe("/student/assignments");
    expect(safeRoleNext("/admin", "student")).toBeNull();
    expect(safeRoleNext("/personal", "teacher")).toBeNull();
    expect(safeRoleNext("//example.com/admin", "admin")).toBeNull();
    expect(safeRoleNext("/admin\\example.com", "admin")).toBeNull();
  });
});

describe("authentication email diagnostics", () => {
  it("returns only safe configuration state and derived callback URLs", () => {
    const diagnostics = getEmailDiagnostics({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://example.com/",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "secret-anon-value",
      SUPABASE_SERVICE_ROLE_KEY: "secret-service-value",
    });

    expect(diagnostics).toEqual({
      currentEnvironment: "production",
      applicationUrl: "https://example.com",
      callbackUrl: "https://example.com/auth/callback",
      appUrlConfigured: true,
      supabaseUrlConfigured: true,
      supabaseAnonKeyConfigured: true,
    });
    expect(JSON.stringify(diagnostics)).not.toContain("secret-anon-value");
    expect(JSON.stringify(diagnostics)).not.toContain("secret-service-value");
  });

  it("reports invalid production application URLs without guessing SMTP state", () => {
    const diagnostics = getEmailDiagnostics({ NODE_ENV: "production" });
    expect(diagnostics.applicationUrl).toBeNull();
    expect(diagnostics.callbackUrl).toBeNull();
    expect(diagnostics.appUrlConfigured).toBe(false);
    expect(adminSystem).toContain("メール配送状況はSupabase Auth Logs / SMTP Providerで確認してください。");
  });
});

describe("safe authentication email errors", () => {
  it("classifies rate limits, unauthorized addresses, and SMTP-like failures", () => {
    expect(getAuthEmailMessage({ code: "over_email_send_rate_limit", status: 429 })).toBe(authEmailMessages.rateLimit);
    expect(getAuthEmailMessage({ code: "email_address_not_authorized", status: 400 })).toBe(authEmailMessages.unauthorizedAddress);
    expect(getAuthEmailMessage({ code: "unexpected_failure", status: 500 })).toBe(authEmailMessages.sendFailure);
  });

  it("logs only operation, error code, and HTTP status fields", () => {
    expect(authLogger).toContain("operation,");
    expect(authLogger).toContain("code:");
    expect(authLogger).toContain("status:");
    expect(authLogger).not.toContain("details.message");
    expect(authLogger).not.toContain("password");
    expect(authLogger).not.toContain("access_token");
    expect(authLogger).not.toContain("refresh_token");
  });
});
