import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const css = source("../app/globals.css");
const shell = source("../components/design-system/AppShell.tsx");
const layout = source("../app/layout.tsx");
const systemDiagnostics = source("../lib/system/diagnostics.ts");
const systemPage = source("../app/admin/system/page.tsx");
const confirmRoute = source("../app/auth/confirm/route.ts");
const middleware = source("../middleware.ts");
const envExample = source("../.env.example");
const authSetup = source("../docs/AUTH_SETUP.md");

describe("application shell layout contracts", () => {
  it("keeps desktop sidebar and mobile navigation fixed without a later position override", () => {
    expect(css).toMatch(/\.app-sidebar\s*\{[\s\S]*?position:\s*fixed/);
    expect(css).toMatch(/\.app-frame\s*\{[\s\S]*?width:\s*calc\(100% - var\(--sidebar-width\)\)/);
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.app-frame\s*\{\s*width:\s*100%;\s*margin-left:\s*0/);
    expect(css).toMatch(/\.mobile-bottom-nav\s*\{\s*position:\s*fixed;\s*inset:\s*auto 0 0 0/);
    expect(css).not.toContain(".app-sidebar, .app-frame, .mobile-bottom-nav { position: relative");
  });

  it("uses the server profile as the initial role and never guesses personal from URL state", () => {
    expect(layout).toContain("getCurrentUser()");
    expect(layout).toContain("initialAccount={initialAccount}");
    expect(shell).toContain("initialAccount: ShellAccount | null");
    expect(shell).not.toContain("parseExperienceRole");
    expect(shell).not.toContain("experienceRoleFromPath");
    expect(shell).not.toContain('?? "personal"');
  });
});

describe("production diagnostics", () => {
  it("checks every required migration table and the private storage bucket", () => {
    for (const table of ["profiles", "hub_materials", "hub_material_versions", "hub_attempts", "hub_answers", "hub_feedback", "hub_characters", "hub_visual_assets", "hub_character_assets", "hub_user_settings", "hub_activity_logs", "hub_classrooms", "hub_classroom_members", "hub_assignments", "hub_assignment_submissions", "hub_ai_generations"]) {
      expect(systemDiagnostics).toContain(`"${table}"`);
    }
    expect(systemDiagnostics).toContain('getBucket("gakugaku-assets")');
    expect(systemDiagnostics).toContain("data.public === false");
    expect(systemPage).toContain('requireRole("admin")');
    expect(systemPage).not.toContain("OPENAI_API_KEY}");
    expect(systemPage).not.toContain("SUPABASE_SERVICE_ROLE_KEY}");
  });

  it("documents every required environment variable without secret values", () => {
    for (const name of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY", "OPENAI_TEXT_MODEL", "OPENAI_IMAGE_MODEL"]) expect(envExample).toContain(`${name}=`);
    expect(envExample).not.toContain("sk-");
    expect(envExample).not.toContain("supabase.co");
  });
});

describe("authentication operations", () => {
  it("supports server-side token hash confirmation and keeps the endpoint public", () => {
    expect(confirmRoute).toContain("verifyOtp({ token_hash: tokenHash, type })");
    expect(confirmRoute).toContain('.from("profiles").select("role")');
    expect(middleware).toContain('"/auth/confirm"');
    expect(authSetup).toContain("{{ .TokenHash }}");
    expect(authSetup).toContain("ADMIN_EMAIL");
  });
});
