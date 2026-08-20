import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aggregateFeedbackSchema,
  answerPayloadSchema,
  answerSubmissionSchema,
  drawingAnswerSchema,
  evaluationSchema,
  learningProfileSummarySchema,
} from "../features/materials/shared/schemas";
import { answerMatchesQuestion, gradeAnswer, requiresAiEvaluation } from "../lib/learning/answers";

const uuid = "11111111-1111-4111-8111-111111111111";
const question = (answerType: "text" | "number" | "choice" | "multiple-choice" | "drawing", correctAnswer: string) => ({
  id: "q1", pageId: "p1", order: 1, prompt: "答えてください", answerType, correctAnswer, explanation: "解説",
});

describe("learning answer contracts", () => {
  it("accepts every supported structured answer", () => {
    expect(answerPayloadSchema.safeParse({ type: "text", value: "回答" }).success).toBe(true);
    expect(answerPayloadSchema.safeParse({ type: "number", value: " ３ " }).success).toBe(true);
    expect(answerPayloadSchema.safeParse({ type: "choice", value: "a" }).success).toBe(true);
    expect(answerPayloadSchema.safeParse({ type: "multiple-choice", values: ["b", "a"] }).success).toBe(true);
    expect(answerPayloadSchema.safeParse({ type: "drawing", assetId: uuid }).success).toBe(true);
    expect(answerSubmissionSchema.safeParse({ questionId: "q1", answer: { type: "drawing", assetId: uuid } }).success).toBe(true);
  });

  it("validates stored handwriting recognition without embedding image data", () => {
    expect(drawingAnswerSchema.safeParse({ type: "drawing", assetId: uuid, recognizedText: "24 ÷ 6 = 4", recognitionConfidence: 0.91 }).success).toBe(true);
    expect(drawingAnswerSchema.safeParse({ type: "drawing", assetId: uuid, recognitionConfidence: 2 }).success).toBe(false);
  });

  it("grades exact, numeric, choice, and unordered multiple choice locally", () => {
    expect(gradeAnswer(question("text", "ねこ"), { type: "text", value: " ねこ " })).toBe(true);
    expect(gradeAnswer(question("number", "3"), { type: "number", value: "３" })).toBe(true);
    expect(gradeAnswer(question("choice", "a"), { type: "choice", value: "a" })).toBe(true);
    expect(gradeAnswer(question("multiple-choice", "a,b"), { type: "multiple-choice", values: ["b", "a"] })).toBe(true);
  });

  it("routes descriptive and drawing work to AI while preserving answer type safety", () => {
    const descriptive = { ...question("text", "考え方を説明する長い正答です。理由と手順を順に書きます。"), prompt: "理由を説明してください" };
    expect(requiresAiEvaluation(descriptive)).toBe(true);
    expect(requiresAiEvaluation(question("drawing", "図"))).toBe(true);
    expect(requiresAiEvaluation(question("number", "4"))).toBe(false);
    expect(answerMatchesQuestion(question("number", "4"), { type: "text", value: "4" })).toBe(false);
  });
});

describe("structured feedback and personalization", () => {
  it("validates problem-level AI evaluation", () => {
    expect(evaluationSchema.safeParse({ verdict: "mostly_correct", score: 75, goodPoint: "式は合っています。", improvement: "単位を確認しましょう。", hint: "問題文の最後を見ます。" }).success).toBe(true);
    expect(evaluationSchema.safeParse({ verdict: "partial", score: 75, goodPoint: "良い", improvement: "確認" }).success).toBe(false);
  });

  it("validates aggregate feedback", () => {
    expect(aggregateFeedbackSchema.safeParse({ summary: "よく取り組めました。", strengths: ["計算"], improvements: ["立式"], recommendedNextSteps: ["文章題"], encouragement: "次も続けましょう。", recommendedDifficulty: "same" }).success).toBe(true);
  });

  it("validates an abstract learning profile without identity fields", () => {
    const profile = { gradeBand: "小学3年", recentSubjects: ["算数"], weakUnits: ["わり算"], strongUnits: ["たし算"], recentAverageScore: 72, commonlyMissedPatterns: ["文章題の立式"], preferredPresentation: "visual-guide", recentFeedbackSummary: ["式を先に書く"] };
    expect(learningProfileSummarySchema.safeParse(profile).success).toBe(true);
    expect(learningProfileSummarySchema.safeParse({ ...profile, email: "student@example.com" }).success).toBe(false);
  });
});

describe("end-to-end implementation contracts", () => {
  const learn = readFileSync(new URL("../app/learn/[id]/LearnForm.tsx", import.meta.url), "utf8");
  const evaluation = readFileSync(new URL("../app/api/attempts/[id]/evaluate/route.ts", import.meta.url), "utf8");
  const materials = readFileSync(new URL("../lib/materials.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/005_learning_experience_completion.sql", import.meta.url), "utf8");

  it("pins a version, uploads drawings, saves answers, then performs one batch evaluation", () => {
    expect(learn).toContain('fetch("/api/attempts/submit"');
    expect(learn).toContain("/handwriting");
    expect(learn).toContain("materialVersionId");
    expect(evaluation).toContain("descriptiveQuestions.map");
    expect(evaluation).toContain('feature: "attempt-feedback"');
  });

  it("keeps history bound to the attempt version and owns-only detail access", () => {
    expect(materials).toContain("attemptRow.materialVersionId");
    expect(materials).toContain("attemptResult.data.user_id !== user.id");
    expect(materials).not.toContain("materials.current_version_id");
  });

  it("adds private answer assets and non-recursive authorization helpers", () => {
    expect(migration).toContain("create table if not exists public.hub_answer_assets");
    expect(migration).toContain("public.hub_can_access_attempt(attempt_id)");
    expect(migration).toContain("public.hub_owns_material(material_id)");
    expect(migration).toContain("public.hub_can_read_storage_object");
    expect(migration).not.toMatch(/drop\s+table/i);
  });
});
