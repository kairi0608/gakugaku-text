import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/003_auth_roles_and_customization.sql", import.meta.url), "utf8");

function policy(name: string) {
  const match = migration.match(new RegExp(`create policy ${name}[\\s\\S]*?;`, "i"));
  return match?.[0] ?? "";
}

describe("RLS isolation contracts", () => {
  it("isolates personal materials and learning attempts by authenticated owner", () => {
    expect(policy("materials_select")).toContain("owner_id = auth.uid()");
    expect(policy("materials_update")).toContain("owner_id = auth.uid()");
    expect(policy("attempts_select")).toContain("user_id = auth.uid()");
    expect(policy("answers_select")).toContain("at.user_id = auth.uid()");
  });

  it("restricts students to their memberships, assignments, answers, and submissions", () => {
    expect(policy("classrooms_select")).toContain("public.hub_is_classroom_member(id)");
    expect(policy("assignments_select")).toContain("public.hub_is_classroom_member(classroom_id)");
    expect(policy("submissions_insert")).toContain("student_id = auth.uid()");
    expect(policy("submissions_insert")).toContain("cm.student_id = auth.uid()");
  });

  it("restricts teachers to their own classes and associated submissions", () => {
    expect(policy("classrooms_update")).toContain("teacher_id = auth.uid()");
    expect(policy("assignments_update")).toContain("teacher_id = auth.uid()");
    expect(policy("submissions_teacher_update")).toContain("a.teacher_id = auth.uid()");
    expect(policy("attempts_select")).toContain("a.teacher_id = auth.uid()");
  });

  it("keeps visual assets private to the owner or an explicitly accessible material", () => {
    expect(policy("visual_assets_select")).toContain("owner_id = auth.uid()");
    expect(policy("visual_assets_select")).toContain("public.hub_student_can_access_version(material_version_id)");
    expect(policy("gakugaku_assets_select")).toContain("public.hub_can_read_storage_object(name)");
    expect(policy("gakugaku_assets_insert")).toContain("auth.uid()::text");
  });
});
