import { NextResponse } from "next/server";
import { z } from "zod";
import { saveCompletedAttempt } from "@/lib/materials";
import { canAccessRoles } from "@/lib/auth/access";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";
const schema = z.object({ materialId: z.string().uuid(), materialVersionId: z.string().uuid().optional(), assignmentId: z.string().uuid().optional(), learnerName: z.string().min(1).max(80), answers: z.array(z.object({ questionId: z.string(), answer: z.string().max(5000) }).strict()) }).strict();
export async function POST(req: Request) {
  try {
    const current = await requireApiRole(["personal", "student", "teacher"]);
    const input = schema.parse(await req.json());
    let fixedVersionId = input.materialVersionId;
    if (input.assignmentId) {
      if (!canAccessRoles(current.profile.role, ["student"])) return NextResponse.json({ error: "課題提出は生徒アカウントで行ってください。" }, { status: 403 });
      const db = await createClient();
      const { data: assignment } = await db.from("hub_assignments").select("material_version_id").eq("id", input.assignmentId).maybeSingle();
      if (!assignment) return NextResponse.json({ error: "課題が見つかりません。" }, { status: 404 });
      fixedVersionId = assignment.material_version_id;
    }
    const result = await saveCompletedAttempt(input.materialId, input.learnerName, input.answers, fixedVersionId);
    if (input.assignmentId) {
      const db = await createClient();
      const now = new Date().toISOString();
      const submission = await db.from("hub_assignment_submissions").upsert({ assignment_id: input.assignmentId, student_id: current.user.id, attempt_id: result.id, status: "submitted", submitted_at: now, updated_at: now }, { onConflict: "assignment_id,student_id" });
      if (submission.error) throw submission.error;
    }
    return NextResponse.json({ ...result, submitted: Boolean(input.assignmentId) });
  } catch (error) {
    return apiError(error, "採点結果を保存できませんでした。");
  }
}
