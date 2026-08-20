import { NextResponse } from "next/server";
import { z } from "zod";
import { aggregateFeedbackSchema, evaluationSchema, materialDocumentSchema } from "@/features/materials/shared/schemas";
import { AiConfigurationError } from "@/lib/ai/errors";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateStructuredContent, getTextModel, type StructuredInputContent } from "@/lib/ai/text-provider";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError, apiServiceUnavailable } from "@/lib/http/api-error";
import { requiresAiEvaluation } from "@/lib/learning/answers";
import { downloadHandwritingDataUrl } from "@/lib/storage/handwriting";
import { createClient } from "@/lib/supabase/server";

const aiQuestionEvaluationSchema = z.object({
  questionId: z.string(),
  verdict: z.enum(["correct", "mostly_correct", "needs_review", "incorrect"]),
  score: z.number().min(0).max(100),
  goodPoint: z.string(),
  improvement: z.string(),
  hint: z.string().nullable(),
  modelAnswer: z.string().nullable(),
  recognizedText: z.string().nullable(),
  recognitionConfidence: z.number().min(0).max(1).nullable(),
  interpretationNotes: z.string().nullable(),
}).strict();

const attemptEvaluationSchema = z.object({
  evaluations: z.array(aiQuestionEvaluationSchema).max(30),
  aggregate: z.object({
    summary: z.string(),
    strengths: z.array(z.string()).max(8),
    improvements: z.array(z.string()).max(8),
    recommendedNextSteps: z.array(z.string()).max(8),
    encouragement: z.string(),
    recommendedDifficulty: z.enum(["easier", "same", "harder"]),
  }).strict(),
}).strict();

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let logId: string | null = null;
  try {
    const current = await requireApiUser();
    const db = await createClient();
    const attemptResult = await db.from("hub_attempts").select("id,user_id,material_version_id,status").eq("id", id).maybeSingle();
    if (attemptResult.error) throw attemptResult.error;
    if (!attemptResult.data || attemptResult.data.user_id !== current.user.id) return NextResponse.json({ error: "学習記録が見つかりません。" }, { status: 404 });
    if (attemptResult.data.status !== "completed") return NextResponse.json({ error: "回答の保存が完了していません。" }, { status: 409 });
    const [versionResult, answersResult, assetsResult] = await Promise.all([
      db.from("hub_material_versions").select("document_json").eq("id", attemptResult.data.material_version_id).single(),
      db.from("hub_answers").select("question_id,answer_text,answer_json,is_correct").eq("attempt_id", id),
      db.from("hub_answer_assets").select("id,question_id,storage_path").eq("attempt_id", id),
    ]);
    if (versionResult.error) throw versionResult.error;
    if (answersResult.error) throw answersResult.error;
    if (assetsResult.error) throw assetsResult.error;
    const document = materialDocumentSchema.parse(versionResult.data.document_json);
    const descriptiveQuestions = document.questions.filter(requiresAiEvaluation);
    if (!descriptiveQuestions.length) {
      await db.from("hub_attempts").update({ feedback_status: "not-required" }).eq("id", id);
      return NextResponse.json({ evaluations: [], aggregate: null, feedbackStatus: "not-required", expAwarded: 0 });
    }
    const answers = new Map((answersResult.data ?? []).map(answer => [String(answer.question_id), answer]));
    const assets = new Map((assetsResult.data ?? []).map(asset => [String(asset.question_id), asset]));
    const promptQuestions = descriptiveQuestions.map(question => {
      const answer = answers.get(question.id);
      if (!answer) throw new Error(`問題${question.order}の保存済み回答がありません。`);
      const asset = assets.get(question.id);
      if (question.answerType === "drawing" && !asset) throw new Error(`問題${question.order}の手書き画像がありません。`);
      return { questionId: question.id, prompt: question.prompt, correctAnswer: question.correctAnswer, explanation: question.explanation, answerType: question.answerType, studentAnswer: answer.answer_text ?? "", hasHandwritingImage: Boolean(asset) };
    });
    const content: StructuredInputContent[] = [{ type: "input_text", text: JSON.stringify({ task: "保存済み回答の一括評価と学習全体の総評", questions: promptQuestions, feedbackPolicy: document.feedbackPolicy, rules: ["画像回答では画像とrecognizedTextの候補を併用する", "認識確信度が低い場合はneeds_reviewにする", "人格ではなく学習内容だけを評価する", "各questionIdをちょうど1回返す"] }) }];
    for (const question of descriptiveQuestions) {
      const asset = assets.get(question.id);
      if (!asset) continue;
      content.push({ type: "input_text", text: `次の画像はquestionId=${question.id}の手書き回答です。` });
      content.push({ type: "input_image", image_url: await downloadHandwritingDataUrl(asset.storage_path), detail: "high" });
    }
    const model = getTextModel();
    logId = await startGeneration({ userId: current.user.id, feature: "attempt-feedback", model, metadata: { attemptId: id, questionCount: descriptiveQuestions.length, imageCount: assets.size } });
    const generated = await generateStructuredContent({
      schema: attemptEvaluationSchema,
      schemaName: "gakugaku_attempt_evaluation",
      instructions: "日本の学習者の回答を、教材に保存された正答と解説だけに基づき公平に評価してください。複数問題をまとめて評価し、短く具体的で尊重ある日本語を使います。内部思考過程は出力しません。",
      content,
    });
    const expectedIds = new Set(descriptiveQuestions.map(question => question.id));
    const generatedIds = new Set(generated.evaluations.map(item => item.questionId));
    if (generatedIds.size !== expectedIds.size || [...expectedIds].some(questionId => !generatedIds.has(questionId))) throw new Error("AI評価の問題IDが保存済み教材と一致しません。");
    const evaluations = generated.evaluations.map(item => {
      const question = document.questions.find(candidate => candidate.id === item.questionId)!;
      const uncertainDrawing = question.answerType === "drawing" && (item.recognitionConfidence ?? 0) < 0.55;
      return {
        questionId: item.questionId,
        ...evaluationSchema.parse({ verdict: uncertainDrawing ? "needs_review" : item.verdict, score: item.score, goodPoint: item.goodPoint, improvement: item.improvement, hint: document.feedbackPolicy.allowHints ? item.hint ?? undefined : undefined, modelAnswer: document.feedbackPolicy.revealAnswer ? item.modelAnswer ?? undefined : undefined }),
        recognizedText: item.recognizedText,
        recognitionConfidence: item.recognitionConfidence,
        interpretationNotes: item.interpretationNotes,
      };
    });
    const aggregate = aggregateFeedbackSchema.parse(generated.aggregate);

    const cleared = await db.from("hub_feedback").delete().eq("attempt_id", id).eq("source", "ai");
    if (cleared.error) throw cleared.error;
    for (const evaluation of evaluations) {
      const answer = answers.get(evaluation.questionId)!;
      const isCorrect = evaluation.verdict === "correct" ? true : evaluation.verdict === "incorrect" ? false : null;
      const answerUpdate: Record<string, unknown> = { is_correct: isCorrect };
      const asset = assets.get(evaluation.questionId);
      if (asset) {
        answerUpdate.answer_text = evaluation.recognizedText ?? "";
        answerUpdate.answer_json = { ...(answer.answer_json && typeof answer.answer_json === "object" ? answer.answer_json : {}), type: "drawing", assetId: asset.id, recognizedText: evaluation.recognizedText, recognitionConfidence: evaluation.recognitionConfidence, interpretationNotes: evaluation.interpretationNotes };
        const assetUpdate = await db.from("hub_answer_assets").update({ recognized_text: evaluation.recognizedText, recognition_confidence: evaluation.recognitionConfidence, recognition_notes: evaluation.interpretationNotes }).eq("id", asset.id);
        if (assetUpdate.error) throw assetUpdate.error;
      }
      const answerUpdateResult = await db.from("hub_answers").update(answerUpdate).eq("attempt_id", id).eq("question_id", evaluation.questionId);
      if (answerUpdateResult.error) throw answerUpdateResult.error;
    }
    const feedbackRows = evaluations.map(evaluation => ({ id: crypto.randomUUID(), attempt_id: id, question_id: evaluation.questionId, source: "ai", feedback_text: [evaluation.goodPoint, evaluation.improvement, evaluation.hint].filter(Boolean).join("\n"), feedback_json: evaluation, score: evaluation.score })) as Array<Record<string, unknown>>;
    feedbackRows.push({ id: crypto.randomUUID(), attempt_id: id, question_id: null, source: "ai", feedback_text: aggregate.summary, feedback_json: aggregate, score: null });
    const feedbackInsert = await db.from("hub_feedback").insert(feedbackRows);
    if (feedbackInsert.error) throw feedbackInsert.error;

    const evaluationScores = new Map(evaluations.map(item => [item.questionId, item.score]));
    const answerCorrectness = new Map((answersResult.data ?? []).map(answer => [String(answer.question_id), answer.is_correct]));
    const totalScore = document.questions.reduce((sum, question) => sum + (requiresAiEvaluation(question) ? evaluationScores.get(question.id) ?? 0 : answerCorrectness.get(question.id) ? 100 : 0), 0);
    const overallScore = Math.round(totalScore / Math.max(1, document.questions.length));
    const attemptUpdate = await db.from("hub_attempts").update({ score: overallScore, feedback_status: "complete" }).eq("id", id).eq("user_id", current.user.id);
    if (attemptUpdate.error) throw attemptUpdate.error;
    const expResult = await db.rpc("hub_finalize_attempt_exp", { p_attempt_id: id });
    if (expResult.error) throw expResult.error;
    await finishGeneration(logId, true);
    return NextResponse.json({ evaluations, aggregate, overallScore, feedbackStatus: "complete", expAwarded: Number(expResult.data ?? 0) });
  } catch (error) {
    try { const db = await createClient(); await db.from("hub_attempts").update({ feedback_status: "failed" }).eq("id", id); } catch { /* The saved attempt remains available even if status update fails. */ }
    if (logId) await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    if (error instanceof AiConfigurationError) return apiServiceUnavailable(error, "AIフィードバックを実行できませんでした。回答と自動採点は保存されています。");
    return apiError(error, "AIフィードバックを実行できませんでした。回答と自動採点は保存されています。");
  }
}
