import { NextResponse } from "next/server";
import { adaptiveQuestionSchema, setFeedbackSchema } from "@/features/learning-session/shared/schemas";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await requireApiUser();
    const { id } = await params;
    const db = await createClient();
    const session = await db.from("hub_learning_sessions").select("*").eq("id", id).maybeSingle();
    if (session.error) throw session.error;
    if (!session.data || session.data.user_id !== current.user.id) return NextResponse.json({ error: "学習セッションが見つかりません。" }, { status: 404 });
    const questions = await db.from("hub_session_questions").select("id,order_number,question_json,answer_json,is_correct,answered_at").eq("session_id", id).order("order_number");
    if (questions.error) throw questions.error;
    return NextResponse.json({ session: session.data, questions: (questions.data ?? []).map(row => ({ ...row, question_json: adaptiveQuestionSchema.parse(row.question_json) })), feedback: setFeedbackSchema.safeParse(session.data.feedback_json).success ? session.data.feedback_json : null });
  } catch (error) {
    return apiError(error, "学習セッションを取得できませんでした。");
  }
}
