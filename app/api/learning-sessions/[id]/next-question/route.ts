import { NextResponse } from "next/server";
import { z } from "zod";
import { adaptiveQuestionSchema, dailyMoodSchema, interestCategorySchema, presentationFamilySchema } from "@/features/learning-session/shared/schemas";
import { buildLearningContext } from "@/features/learning-session/server/learning-context";
import { createTypicalQuestion } from "@/features/learning-session/server/typical-question";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const generatedQuestionSchema = z.object({
  prompt: z.string().min(1).max(1200),
  answerType: z.enum(["number", "choice"]),
  choices: z.array(z.object({ id: z.string().min(1).max(80), label: z.string().min(1).max(300) }).strict()).max(6),
  correctAnswer: z.string().min(1).max(500),
  explanation: z.string().min(1).max(1200),
  difficulty: z.enum(["easy", "standard", "challenge"]),
  typicalPattern: z.string().min(1).max(240),
}).strict();

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let logId: string | null = null;
  try {
    const current = await requireApiUser();
    const db = await createClient();
    const session = await db.from("hub_learning_sessions").select("*").eq("id", id).maybeSingle();
    if (session.error) throw session.error;
    if (!session.data || session.data.user_id !== current.user.id) return NextResponse.json({ error: "学習セッションが見つかりません。" }, { status: 404 });
    if (session.data.mode !== "self-practice" || session.data.status !== "active") return NextResponse.json({ error: "次の問題を生成できる状態ではありません。" }, { status: 409 });
    if (session.data.completed_question_count >= session.data.target_question_count) return NextResponse.json({ error: "設定した問題数を完了しています。" }, { status: 409 });
    const last = await db.from("hub_session_questions").select("id,order_number,answered_at,is_correct,question_json").eq("session_id", id).order("order_number", { ascending: false }).limit(1).maybeSingle();
    if (last.error) throw last.error;
    if (!last.data?.answered_at || last.data.order_number !== session.data.completed_question_count) return NextResponse.json({ error: "前の回答が保存されていません。" }, { status: 409 });
    const nextOrder = last.data.order_number + 1;
    const existing = await db.from("hub_session_questions").select("question_json").eq("session_id", id).eq("order_number", nextOrder).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return NextResponse.json({ question: adaptiveQuestionSchema.parse(existing.data.question_json), resumed: true });
    const context = await buildLearningContext({
      userId: current.user.id,
      role: current.profile.role,
      mood: dailyMoodSchema.nullable().parse(session.data.mood),
      presentationFamily: presentationFamilySchema.parse(session.data.presentation_family),
      interestCategory: interestCategorySchema.parse(session.data.interest_category),
      questionCount: session.data.target_question_count as 3 | 5 | 10,
      difficulty: session.data.difficulty,
    });
    const model = getTextModel();
    logId = await startGeneration({ userId: current.user.id, feature: "adaptive-question", model, metadata: { sessionId: id, order: nextOrder } });
    let question;
    let notice: string | undefined;
    try {
      const generated = await generateStructuredText({
        schema: generatedQuestionSchema,
        schemaName: "gakugaku_adaptive_question",
        instructions: "日本の学習者向けの典型問題を1問だけ作成します。奇抜な出題や未確認の事実を避け、正答と解説を再計算して一致させます。HTMLや個人情報は出力しません。",
        prompt: JSON.stringify({ task: "制約内で次の典型問題を作る", subject: session.data.subject, unit: session.data.unit, order: nextOrder, previousCorrect: last.data.is_correct, previousQuestion: adaptiveQuestionSchema.parse(last.data.question_json).typicalPattern, learningContext: context, rules: ["numberまたはchoiceにする", "choiceのcorrectAnswerはchoice.id", "直前が不正解なら同じ典型パターンを少し易しくする", "気分は文章量と導入の軽い調整だけに使い能力を推測しない", "interestCategoryは世界観だけに使い教科内容を変えない"] }),
      });
      question = adaptiveQuestionSchema.parse({ ...generated, id: crypto.randomUUID(), generationSource: "ai" });
      await finishGeneration(logId, true); logId = null;
    } catch (generationError) {
      question = createTypicalQuestion({ subject: String(session.data.subject), unit: String(session.data.unit), difficulty: session.data.difficulty, order: nextOrder, source: "system-fallback" });
      notice = "AI生成を利用できなかったため、確認済みの典型問題を表示しています。";
      if (logId) { await finishGeneration(logId, false, generationError instanceof Error ? generationError.name : "generation_error"); logId = null; }
    }
    const inserted = await db.from("hub_session_questions").insert({ id: question.id, session_id: id, order_number: nextOrder, question_json: question, generated_from_question_id: last.data.id });
    if (inserted.error) throw inserted.error;
    return NextResponse.json({ question, notice, resumed: false }, { status: 201 });
  } catch (error) {
    if (logId) await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    return apiError(error, "次の問題を準備できませんでした。現在の回答は保存されています。");
  }
}
