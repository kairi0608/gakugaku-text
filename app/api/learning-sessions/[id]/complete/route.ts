import { NextResponse } from "next/server";
import { z } from "zod";
import { adaptiveQuestionSchema, setFeedbackSchema } from "@/features/learning-session/shared/schemas";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ attemptId: z.string().uuid().optional() }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let logId: string | null = null;
  try {
    const current = await requireApiUser();
    const input = inputSchema.parse(await request.json().catch(() => ({})));
    const db = await createClient();
    const session = await db.from("hub_learning_sessions").select("*").eq("id", id).maybeSingle();
    if (session.error) throw session.error;
    if (!session.data || session.data.user_id !== current.user.id) return NextResponse.json({ error: "学習セッションが見つかりません。" }, { status: 404 });
    if (session.data.status === "completed") return NextResponse.json({ feedback: session.data.feedback_json, score: session.data.score, expAwarded: session.data.exp_awarded, feedbackStatus: session.data.feedback_status, resumed: true });
    if (session.data.mode === "assigned") {
      if (!input.attemptId) return NextResponse.json({ error: "提出結果が必要です。" }, { status: 400 });
      const attempt = await db.from("hub_attempts").select("id,user_id,status,score,exp_awarded,feedback_status").eq("id", input.attemptId).maybeSingle();
      if (attempt.error) throw attempt.error;
      if (!attempt.data || attempt.data.user_id !== current.user.id || attempt.data.status !== "completed") return NextResponse.json({ error: "提出結果が見つかりません。" }, { status: 404 });
      const now = Date.now(); const activeDelta = Math.max(0, Math.min(300, Math.floor((now - Date.parse(session.data.last_activity_at)) / 1000)));
      const update = await db.from("hub_learning_sessions").update({ attempt_id: input.attemptId, status: "completed", completed_question_count: session.data.target_question_count, score: attempt.data.score, feedback_status: attempt.data.feedback_status, exp_awarded: attempt.data.exp_awarded, active_seconds: Number(session.data.active_seconds ?? 0) + activeDelta, completed_at: new Date(now).toISOString(), last_activity_at: new Date(now).toISOString() }).eq("id", id);
      if (update.error) throw update.error;
      return NextResponse.json({ score: attempt.data.score, expAwarded: attempt.data.exp_awarded, feedbackStatus: attempt.data.feedback_status });
    }
    if (session.data.completed_question_count < session.data.target_question_count) return NextResponse.json({ error: "設定した問題数がまだ完了していません。" }, { status: 409 });
    const rows = await db.from("hub_session_questions").select("question_json,answer_json,is_correct").eq("session_id", id).order("order_number");
    if (rows.error) throw rows.error;
    const gradable = (rows.data ?? []).filter(row => row.is_correct !== null);
    const correct = gradable.filter(row => row.is_correct === true).length;
    const score = gradable.length ? Math.round(correct / gradable.length * 100) : null;
    let feedbackStatus: "complete" | "failed" = "complete";
    let feedback;
    try {
      const model = getTextModel();
      logId = await startGeneration({ userId: current.user.id, feature: "set-feedback", model, metadata: { sessionId: id, questionCount: rows.data?.length ?? 0 } });
      feedback = await generateStructuredText({
        schema: setFeedbackSchema,
        schemaName: "gakugaku_set_feedback",
        instructions: "学習セット全体を短く振り返ります。人格評価を避け、初期表示で読める1〜2文の具体的な日本語にします。",
        prompt: JSON.stringify({ subject: session.data.subject, unit: session.data.unit, completed: session.data.completed_question_count, correct, score, results: (rows.data ?? []).map(row => ({ pattern: adaptiveQuestionSchema.parse(row.question_json).typicalPattern, correct: row.is_correct })) }),
      });
      await finishGeneration(logId, true); logId = null;
    } catch (generationError) {
      feedbackStatus = "failed";
      feedback = setFeedbackSchema.parse({ summary: `${session.data.completed_question_count}問の学習を完了しました。結果は保存されています。`, strength: "最後まで取り組めました。", nextStep: "間違えた典型問題をもう一度確認しましょう。", recommendedDifficulty: "same" });
      if (logId) { await finishGeneration(logId, false, generationError instanceof Error ? generationError.name : "generation_error"); logId = null; }
    }
    const completed = await db.from("hub_learning_sessions").update({ status: "completed", score, feedback_json: feedback, feedback_status: feedbackStatus, completed_at: new Date().toISOString(), last_activity_at: new Date().toISOString() }).eq("id", id);
    if (completed.error) throw completed.error;
    const exp = await db.rpc("hub_finalize_learning_session", { p_session_id: id });
    if (exp.error) throw exp.error;
    return NextResponse.json({ feedback, score, expAwarded: Number(exp.data ?? 0), feedbackStatus });
  } catch (error) {
    if (logId) await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    return apiError(error, "学習結果をまとめられませんでした。回答は保存されています。");
  }
}
