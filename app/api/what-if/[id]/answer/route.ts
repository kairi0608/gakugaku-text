import { NextResponse } from "next/server";
import { z } from "zod";
import { whatIfFeedbackSchema, whatIfQuestionSchema } from "@/features/learning-session/shared/schemas";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ answer: z.string().trim().min(1).max(5000) }).strict();
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let logId: string | null = null;
  try {
    const current = await requireApiRole(["student"]); const { id } = await params; const input = schema.parse(await request.json()); const db = await createClient(); const now = new Date().toISOString();
    await db.rpc("hub_record_daily_login");
    const event = await db.from("hub_special_events").select("id,enabled,start_at,end_at,trigger_type,trigger_config,what_if_json").eq("id", id).maybeSingle();
    if (event.error) throw event.error;
    if (!event.data || !event.data.enabled || event.data.start_at > now || (event.data.end_at && event.data.end_at <= now)) return NextResponse.json({ error: "このイベントには現在参加できません。" }, { status: 404 });
    if (event.data.trigger_type === "login-streak") { const streak = await db.rpc("hub_current_login_streak"); const config = event.data.trigger_config as { streakDays?: unknown }; if (streak.error || Number(streak.data ?? 0) < Number(config?.streakDays ?? 7)) return NextResponse.json({ error: "このイベントの出現条件をまだ満たしていません。" }, { status: 403 }); }
    const existing = await db.from("hub_what_if_participations").select("feedback_json,exp_awarded").eq("event_id", id).eq("user_id", current.user.id).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return NextResponse.json({ feedback: existing.data.feedback_json, expAwarded: existing.data.exp_awarded, resumed: true });
    const question = whatIfQuestionSchema.parse(event.data.what_if_json);
    let feedback; let feedbackSource: "ai" | "system-fallback" = "ai";
    try {
      const model = getTextModel(); logId = await startGeneration({ userId: current.user.id, feature: "what-if", model, metadata: { eventId: id, source: "student-answer" } });
      feedback = await generateStructuredText({ schema: whatIfFeedbackSchema, schemaName: "gakugaku_what_if_feedback", instructions: "生徒の仮説を否定せず、良い着眼点を具体的に1文で返します。必要な場合だけ科学的補足を短く添えます。人格評価・診断・長文・正解の押し付けを避けます。", prompt: JSON.stringify({ question: question.question, learningConnections: question.learningConnections, studentHypothesis: input.answer }) });
      await finishGeneration(logId, true); logId = null;
    } catch (generationError) {
      feedbackSource = "system-fallback";
      feedback = whatIfFeedbackSchema.parse({ response: "自分なりの理由を考えて言葉にできました。条件を一つ変えると結果がどう変わるかも考えてみよう。", scientificNote: null });
      if (logId) { await finishGeneration(logId, false, generationError instanceof Error ? generationError.name : "generation_error"); logId = null; }
    }
    const inserted = await db.from("hub_what_if_participations").insert({ id: crypto.randomUUID(), event_id: id, user_id: current.user.id, answer_text: input.answer, feedback_json: { ...feedback, source: feedbackSource } });
    if (inserted.error) throw inserted.error;
    const exp = await db.rpc("hub_finalize_what_if", { p_event_id: id }); if (exp.error) throw exp.error;
    return NextResponse.json({ feedback, feedbackSource, expAwarded: Number(exp.data ?? 0) });
  } catch (error) {
    if (logId) await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    return apiError(error, "回答を保存できませんでした。保存済みとは表示していません。");
  }
}
