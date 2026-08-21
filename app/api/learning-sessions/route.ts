import { NextResponse } from "next/server";
import { materialDocumentSchema } from "@/features/materials/shared/schemas";
import { learningSessionCreateSchema } from "@/features/learning-session/shared/schemas";
import { createTypicalQuestion } from "@/features/learning-session/server/typical-question";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const current = await requireApiRole(["personal", "student", "teacher"]);
    const input = learningSessionCreateSchema.parse(await request.json());
    const db = await createClient();
    if (input.mode === "assigned") {
      if (current.profile.role !== "student") return NextResponse.json({ error: "課題セッションは生徒アカウントで開始してください。" }, { status: 403 });
      const assignment = await db.from("hub_assignments").select("id,material_version_id,published_at").eq("id", input.assignmentId!).maybeSingle();
      if (assignment.error) throw assignment.error;
      if (!assignment.data?.published_at || assignment.data.material_version_id !== input.materialVersionId) return NextResponse.json({ error: "公開済み課題が見つかりません。" }, { status: 404 });
      const existing = await db.from("hub_learning_sessions").select("id").eq("user_id", current.user.id).eq("assignment_id", input.assignmentId!).eq("status", "active").maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return NextResponse.json({ id: existing.data.id, resumed: true });
      const version = await db.from("hub_material_versions").select("document_json").eq("id", input.materialVersionId!).single();
      if (version.error) throw version.error;
      const document = materialDocumentSchema.parse(version.data.document_json);
      const id = crypto.randomUUID();
      const created = await db.from("hub_learning_sessions").insert({ id, user_id: current.user.id, material_version_id: input.materialVersionId, assignment_id: input.assignmentId, mode: "assigned", status: "active", target_question_count: document.questions.length, feedback_mode: "after-set", presentation_family: document.presentation.presentationFamily ?? input.presentationFamily, interest_category: document.presentation.interestCategory ?? input.interestCategory, material_theme: document.presentation.visualTheme, mood: input.mood ?? null, subject: document.metadata.subject, unit: document.metadata.unit, difficulty: document.metadata.difficulty }).select("id").single();
      if (created.error) throw created.error;
      return NextResponse.json({ id: created.data.id, resumed: false }, { status: 201 });
    }
    if (input.mode !== "self-practice") return NextResponse.json({ error: "この開始方法は利用できません。" }, { status: 400 });
    const id = crypto.randomUUID();
    const created = await db.from("hub_learning_sessions").insert({ id, user_id: current.user.id, mode: "self-practice", status: "active", target_question_count: input.targetQuestionCount, feedback_mode: "after-set", presentation_family: input.presentationFamily, interest_category: input.interestCategory, material_theme: input.interestCategory, mood: input.mood ?? null, subject: input.subject, unit: input.unit, difficulty: input.difficulty }).select("id").single();
    if (created.error) throw created.error;
    const firstQuestion = createTypicalQuestion({ subject: input.subject!, unit: input.unit!, difficulty: input.mood === "low" ? "easy" : input.difficulty, order: 1 });
    const questionResult = await db.from("hub_session_questions").insert({ id: firstQuestion.id, session_id: id, order_number: 1, question_json: firstQuestion });
    if (questionResult.error) throw questionResult.error;
    return NextResponse.json({ id, question: firstQuestion }, { status: 201 });
  } catch (error) {
    return apiError(error, "学習セッションを開始できませんでした。");
  }
}
