import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluationSchema, materialDocumentSchema } from "@/features/materials/shared/schemas";
import { AiConfigurationError } from "@/lib/ai/errors";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { saveAiFeedback } from "@/lib/materials";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ questionId: z.string().min(1), studentAnswer: z.string().max(5000) }).strict();
const aiEvaluationSchema = z.object({ verdict: z.enum(["correct", "partial", "incorrect"]), score: z.number().min(0).max(100), goodPoint: z.string(), improvement: z.string(), hint: z.string(), modelAnswer: z.string().nullable() }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let logId: string | null = null;
  try {
    const current = await requireApiUser();
    const input = inputSchema.parse(await request.json());
    const { id } = await params;
    const db = await createClient();
    const { data: attempt, error: attemptError } = await db.from("hub_attempts").select("id,material_version_id").eq("id", id).maybeSingle();
    if (attemptError) throw attemptError;
    if (!attempt) return NextResponse.json({ error: "学習記録が見つかりません。" }, { status: 404 });
    const { data: version, error: versionError } = await db.from("hub_material_versions").select("document_json").eq("id", attempt.material_version_id).single();
    if (versionError) throw versionError;
    const document = materialDocumentSchema.parse(version.document_json);
    const question = document.questions.find(item => item.id === input.questionId);
    if (!question) return NextResponse.json({ error: "問題が見つかりません。" }, { status: 404 });
    if (question.answerType !== "text" && question.answerType !== "drawing") return NextResponse.json({ error: "この問題は自動採点の対象です。" }, { status: 400 });
    const { data: storedAnswer, error: answerError } = await db.from("hub_answers").select("answer_text").eq("attempt_id", id).eq("question_id", input.questionId).maybeSingle();
    if (answerError) throw answerError;
    if (!storedAnswer) return NextResponse.json({ error: "保存済みの回答が見つかりません。" }, { status: 404 });
    if ((storedAnswer.answer_text ?? "") !== input.studentAnswer) return NextResponse.json({ error: "保存済みの回答と評価対象が一致しません。" }, { status: 409 });
    const model = getTextModel();
    logId = await startGeneration({ userId: current.user.id, feature: "evaluation", model, metadata: { attemptId: id, questionId: input.questionId } });
    const generated = await generateStructuredText({
      schema: aiEvaluationSchema,
      schemaName: "gakugaku_answer_evaluation",
      instructions: "学習者の回答を、提示された正答と説明だけに基づいて公平に評価してください。短く具体的に励まし、内部思考過程は出力しません。",
      prompt: JSON.stringify({ question: question.prompt, correctAnswer: question.correctAnswer, rubric: question.explanation, studentAnswer: storedAnswer.answer_text ?? "", feedbackPolicy: document.feedbackPolicy }),
    });
    const result = evaluationSchema.parse({ ...generated, modelAnswer: document.feedbackPolicy.revealAnswer ? generated.modelAnswer ?? undefined : undefined });
    const { error: correctnessError } = await db.from("hub_answers").update({ is_correct: result.verdict === "correct" }).eq("attempt_id", id).eq("question_id", input.questionId);
    if (correctnessError) throw correctnessError;
    await saveAiFeedback({ attemptId: id, questionId: input.questionId, score: result.score, feedbackText: [result.goodPoint, result.improvement, result.hint].filter(Boolean).join("\n") });
    const [{ data: answers, error: answersError }, { data: feedback, error: feedbackError }] = await Promise.all([
      db.from("hub_answers").select("question_id,is_correct").eq("attempt_id", id),
      db.from("hub_feedback").select("question_id,score,source,created_at").eq("attempt_id", id).eq("source", "ai").order("created_at", { ascending: false }),
    ]);
    if (answersError) throw answersError;
    if (feedbackError) throw feedbackError;
    const answersByQuestion = new Map((answers ?? []).map(answer => [answer.question_id, answer.is_correct]));
    const aiScoreByQuestion = new Map<string, number>();
    for (const item of feedback ?? []) if (item.question_id && !aiScoreByQuestion.has(item.question_id)) aiScoreByQuestion.set(item.question_id, Number(item.score ?? 0));
    const totalScore = document.questions.reduce((sum, item) => {
      if (item.answerType === "text" || item.answerType === "drawing") return sum + (aiScoreByQuestion.get(item.id) ?? 0);
      return sum + (answersByQuestion.get(item.id) ? 100 : 0);
    }, 0);
    const overallScore = Math.round(totalScore / Math.max(1, document.questions.length));
    const { error: scoreError } = await db.from("hub_attempts").update({ score: overallScore }).eq("id", id);
    if (scoreError) throw scoreError;
    const { data: expAwarded, error: expError } = await db.rpc("hub_finalize_attempt_exp", { p_attempt_id: id });
    if (expError) throw expError;
    await finishGeneration(logId, true);
    return NextResponse.json({ ...result, overallScore, expAwarded: Number(expAwarded ?? 0) });
  } catch (error) {
    if (logId) await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    if (error instanceof AiConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    return apiError(error, "AI評価を実行できませんでした。");
  }
}
