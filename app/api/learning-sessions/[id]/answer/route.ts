import { NextResponse } from "next/server";
import { z } from "zod";
import { adaptiveQuestionSchema } from "@/features/learning-session/shared/schemas";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { normalize } from "@/lib/grading";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ questionId: z.string().uuid(), answer: z.string().trim().min(1).max(5000) }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await requireApiUser();
    const { id } = await params;
    const input = schema.parse(await request.json());
    const db = await createClient();
    const session = await db.from("hub_learning_sessions").select("id,user_id,status,target_question_count,completed_question_count,correct_question_count,last_activity_at").eq("id", id).maybeSingle();
    if (session.error) throw session.error;
    if (!session.data || session.data.user_id !== current.user.id) return NextResponse.json({ error: "学習セッションが見つかりません。" }, { status: 404 });
    if (session.data.status !== "active") return NextResponse.json({ error: "この学習セットは終了しています。" }, { status: 409 });
    const row = await db.from("hub_session_questions").select("id,order_number,question_json,answered_at").eq("id", input.questionId).eq("session_id", id).maybeSingle();
    if (row.error) throw row.error;
    if (!row.data || row.data.answered_at || row.data.order_number !== session.data.completed_question_count + 1) return NextResponse.json({ error: "回答する問題の順番が一致しません。" }, { status: 409 });
    const question = adaptiveQuestionSchema.parse(row.data.question_json);
    const isCorrect = question.answerType === "text" ? null : normalize(input.answer) === normalize(question.correctAnswer);
    const now = Date.now();
    const activeDelta = Math.max(0, Math.min(300, Math.floor((now - Date.parse(session.data.last_activity_at)) / 1000)));
    const recorded = await db.rpc("hub_record_session_answer", { p_session_id: id, p_question_id: row.data.id, p_answer: { type: question.answerType, value: input.answer }, p_is_correct: isCorrect, p_active_seconds: activeDelta });
    if (recorded.error) throw recorded.error;
    return NextResponse.json({ recorded: true, setComplete: Boolean(recorded.data) });
  } catch (error) {
    return apiError(error, "回答を保存できませんでした。");
  }
}
