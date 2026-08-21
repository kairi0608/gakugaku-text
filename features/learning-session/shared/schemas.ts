import { z } from "zod";

export const presentationFamilySchema = z.enum(["real", "illustration"]);
export const interestCategorySchema = z.enum(["animals", "space", "sports", "vehicles", "nature", "adventure"]);
export const dailyMoodSchema = z.enum(["very-good", "good", "neutral", "tired", "low"]);
export const feedbackModeSchema = z.enum(["after-set", "after-each"]);
export const learningSessionModeSchema = z.enum(["assigned", "self-practice", "what-if"]);
export const learningSessionStatusSchema = z.enum(["active", "completed", "abandoned"]);
export const materialStatusSchema = z.enum(["draft", "reviewing", "approved", "published", "archived"]);
export const reviewDecisionSchema = z.enum(["approved", "rejected", "needs_revision"]);
export const whatIfTriggerSchema = z.enum(["schedule", "login-streak", "study-time", "completed-problems"]);

export const adaptiveQuestionSchema = z.object({
  id: z.string().uuid(),
  prompt: z.string().min(1).max(1200),
  answerType: z.enum(["number", "choice", "text"]),
  choices: z.array(z.object({ id: z.string().min(1).max(80), label: z.string().min(1).max(300) }).strict()).max(6),
  correctAnswer: z.string().min(1).max(500),
  explanation: z.string().min(1).max(1200),
  difficulty: z.enum(["easy", "standard", "challenge"]),
  typicalPattern: z.string().min(1).max(240),
  generationSource: z.enum(["ai", "system-template", "system-fallback"]),
}).strict().superRefine((question, context) => {
  const choiceIds = new Set(question.choices.map(choice => choice.id));
  if (question.answerType === "choice" && (!question.choices.length || !choiceIds.has(question.correctAnswer))) context.addIssue({ code: "custom", path: ["correctAnswer"], message: "正答が選択肢と一致しません。" });
  if (question.answerType === "number" && !Number.isFinite(Number(question.correctAnswer.normalize("NFKC")))) context.addIssue({ code: "custom", path: ["correctAnswer"], message: "数値問題の正答が数値ではありません。" });
});

export const learningSessionCreateSchema = z.object({
  mode: learningSessionModeSchema,
  materialVersionId: z.string().uuid().optional(),
  assignmentId: z.string().uuid().optional(),
  subject: z.string().trim().min(1).max(120).optional(),
  unit: z.string().trim().min(1).max(160).optional(),
  difficulty: z.enum(["easy", "standard", "challenge"]).default("standard"),
  targetQuestionCount: z.union([z.literal(3), z.literal(5), z.literal(10)]).default(5),
  feedbackMode: feedbackModeSchema.default("after-set"),
  presentationFamily: presentationFamilySchema.default("illustration"),
  interestCategory: interestCategorySchema.default("adventure"),
  mood: dailyMoodSchema.nullable().optional(),
}).strict().superRefine((input, context) => {
  if (input.mode === "assigned" && (!input.materialVersionId || !input.assignmentId)) context.addIssue({ code: "custom", path: ["assignmentId"], message: "課題情報が不足しています。" });
  if (input.mode === "self-practice" && (!input.subject || !input.unit)) context.addIssue({ code: "custom", path: ["subject"], message: "教科と単元を指定してください。" });
  if (input.feedbackMode !== "after-set") context.addIssue({ code: "custom", path: ["feedbackMode"], message: "現在選択できるのはセット終了後のフィードバックだけです。" });
});

export const learningContextSchema = z.object({
  gradeBand: z.string().max(80).optional(),
  recentPerformance: z.number().min(0).max(100).optional(),
  weakPatterns: z.array(z.string().max(300)).max(8),
  strongPatterns: z.array(z.string().max(300)).max(8),
  mood: dailyMoodSchema.nullable(),
  presentationFamily: presentationFamilySchema,
  interestCategory: interestCategorySchema,
  questionCount: z.union([z.literal(3), z.literal(5), z.literal(10)]),
  difficulty: z.enum(["easy", "standard", "challenge"]),
  moodGuidance: z.array(z.string().max(240)).max(4),
}).strict();

export const setFeedbackSchema = z.object({
  summary: z.string().min(1).max(260),
  strength: z.string().min(1).max(180),
  nextStep: z.string().min(1).max(180),
  recommendedDifficulty: z.enum(["easier", "same", "harder"]),
}).strict();

export const whatIfQuestionSchema = z.object({
  title: z.string().min(1).max(160),
  question: z.string().min(1).max(1400),
  visualBrief: z.string().max(800).optional(),
  thinkingHints: z.array(z.string().min(1).max(300)).max(5),
  learningConnections: z.array(z.object({ subject: z.string().min(1).max(120), concept: z.string().min(1).max(240) }).strict()).max(5),
}).strict();

export const whatIfFeedbackSchema = z.object({
  response: z.string().min(1).max(280),
  scientificNote: z.string().max(280).nullable(),
}).strict();

export const specialEventCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  classroomId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().nullable().optional(),
  triggerType: z.enum(["schedule", "login-streak"]),
  streakDays: z.number().int().min(2).max(365).default(7),
  source: z.enum(["ai", "teacher"]),
  question: z.string().max(1400).optional(),
  presentationFamily: presentationFamilySchema.default("illustration"),
  enabled: z.boolean().default(true),
}).strict().superRefine((input, context) => {
  if (input.source === "teacher" && !input.question?.trim()) context.addIssue({ code: "custom", path: ["question"], message: "教師作成では問題文が必要です。" });
  if (input.endAt && Date.parse(input.endAt) <= Date.parse(input.startAt)) context.addIssue({ code: "custom", path: ["endAt"], message: "終了日時は開始日時より後にしてください。" });
});
