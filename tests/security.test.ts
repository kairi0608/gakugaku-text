import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/003_auth_roles_and_customization.sql", import.meta.url), "utf8");
const signupMigration = readFileSync(new URL("../supabase/migrations/004_auth_signup_roles_and_email_support.sql", import.meta.url), "utf8");
const sourceFiles = [
  "../lib/supabase/client.ts",
  "../components/design-system/AppShell.tsx",
  "../app/create/CreateForm.tsx",
  "../app/learn/[id]/LearnForm.tsx",
].map(path => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
const teacherApi = readFileSync(new URL("../app/api/classrooms/route.ts", import.meta.url), "utf8");
const adminPage = readFileSync(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
const adminRoleApi = readFileSync(new URL("../app/api/admin/users/[id]/role/route.ts", import.meta.url), "utf8");

describe("authorization migration", () => {
  it("is non-destructive for existing product tables", () => {
    expect(migration).not.toMatch(/drop\s+table/i);
    expect(migration).not.toMatch(/truncate/i);
    expect(migration).toContain("add column if not exists owner_id");
    expect(migration).toContain("add column if not exists user_id");
  });
  it("enables RLS and creates owner policies", () => {
    expect(migration).toContain("alter table public.profiles enable row level security");
    expect(migration).toContain("owner_id = auth.uid()");
    expect(migration).toContain("student_id = auth.uid()");
    expect(migration).toContain("teacher_id = auth.uid()");
  });
  it("allows teacher signup while preventing client-selected admin", () => {
    expect(signupMigration).toContain("requested_role in ('personal', 'student', 'teacher')");
    expect(signupMigration).not.toContain("requested_role in ('personal', 'student', 'teacher', 'admin')");
    expect(migration).toContain("role changes require administrator privileges");
  });
  it("keeps the asset bucket private and scoped by user path", () => {
    expect(migration).toContain("'gakugaku-assets', false");
    expect(migration).toContain("(storage.foldername(name))[2] = auth.uid()::text");
  });
  it("keeps EXP, active character images, and submission identity server-controlled", () => {
    expect(migration).toContain("revoke update on public.hub_characters from authenticated");
    expect(migration).toContain("revoke update on public.hub_character_assets from authenticated");
    expect(migration).toContain("submission identity fields are immutable");
    expect(migration).toContain("hub_finalize_attempt_exp");
  });
  it("isolates teachers, students, answers, and profiles in database policies", () => {
    expect(migration).toContain("teacher_id = auth.uid()");
    expect(migration).toContain("cm.student_id = auth.uid()");
    expect(migration).toContain("at.user_id = auth.uid()");
    expect(migration).toContain("grant update(display_name, grade_band, updated_at) on public.profiles");
    expect(migration).not.toContain("grant update on public.profiles to authenticated");
  });
  it("guards protected routes and privileged role entry points on the server", () => {
    expect(middleware).toContain('login.pathname = "/auth/login"');
    expect(middleware).toContain('{ status: 401 }');
    expect(teacherApi).toContain('requireApiRole(["teacher"]');
    expect(adminPage).toContain('requireRole("admin")');
    expect(adminRoleApi).toContain('id === current.user.id && input.role !== "admin"');
  });
  it("authorizes signed storage reads through asset ownership", () => {
    expect(migration).toContain("public.hub_can_read_storage_object(name)");
    expect(migration).toContain("va.owner_id = auth.uid()");
  });
});

describe("secret isolation", () => {
  it("does not reference service-role or OpenAI secrets in client modules", () => {
    expect(sourceFiles).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(sourceFiles).not.toContain("process.env.OPENAI_API_KEY");
  });
});
