import { z } from "zod";

const base = z.object({ id: z.string().min(1) }).strict();
export const materialBlockSchema = z.discriminatedUnion("type", [
  base.extend({ type: z.literal("title"), text: z.string() }).strict(),
  base.extend({ type: z.literal("subtitle"), text: z.string() }).strict(),
  base.extend({ type: z.literal("illustration"), assetId: z.string(), alt: z.string() }).strict(),
  base.extend({ type: z.literal("character"), assetId: z.string(), alt: z.string() }).strict(),
  base.extend({ type: z.literal("example"), title: z.string(), text: z.string() }).strict(),
  base.extend({ type: z.literal("point"), title: z.string(), text: z.string() }).strict(),
  base.extend({ type: z.literal("question"), questionId: z.string() }).strict(),
  base.extend({ type: z.literal("speech-bubble"), text: z.string() }).strict(),
  base.extend({ type: z.literal("answer-field"), questionId: z.string() }).strict(),
  base.extend({ type: z.literal("footer-message"), text: z.string() }).strict(),
]);

export const questionSchema = z.object({
  id: z.string(), pageId: z.string(), order: z.number().int().positive(), title: z.string().optional(),
  narrative: z.string().optional(), prompt: z.string().min(1), instructions: z.string().optional(),
  answerType: z.enum(["text", "number", "choice", "multiple-choice", "drawing"]),
  choices: z.array(z.object({ id: z.string(), label: z.string() }).strict()).optional(),
  correctAnswer: z.string(), explanation: z.string(),
}).strict();

export const materialDocumentSchema = z.object({
  version: z.literal(1),
  metadata: z.object({ title: z.string(), grade: z.string(), subject: z.string(), unit: z.string(), objective: z.string(), difficulty: z.enum(["easy", "standard", "challenge"]), description: z.string().optional() }).strict(),
  presentation: z.object({ format: z.enum(["simple", "visual-guide", "adventure", "comic", "picture-book", "game-card", "worksheet-poster"]), pageSize: z.enum(["screen", "a4-portrait", "a4-landscape"]), visualTheme: z.string(), colorPalette: z.array(z.string()).min(2) }).strict(),
  pages: z.array(z.object({ id: z.string(), pageNumber: z.number().int().positive(), backgroundAssetId: z.string().optional(), blocks: z.array(materialBlockSchema) }).strict()).min(1),
  questions: z.array(questionSchema).min(1),
  feedbackPolicy: z.object({ tone: z.enum(["gentle", "standard", "detailed"]), revealAnswer: z.boolean(), allowHints: z.boolean(), maxHints: z.number().int().nonnegative().optional() }).strict(),
  accessibility: z.object({ highContrast: z.boolean(), largeText: z.boolean(), readingSupport: z.boolean(), imageDescription: z.string() }).strict(),
}).strict();

export const generationInputSchema = z.object({
  grade: z.string().min(1),
  subject: z.string().min(1),
  unit: z.string().min(1),
  difficulty: z.enum(["easy", "standard", "challenge"]),
  questionCount: z.coerce.number().int().min(1).max(12),
  format: z.enum(["simple", "visual-guide", "adventure", "comic", "picture-book", "game-card", "worksheet-poster"]),
  request: z.string().max(2000),
  avoid: z.string().max(500),
  textAmount: z.enum(["short", "standard", "long"]),
  imageAmount: z.enum(["few", "standard", "many"]),
  answerType: z.enum(["text", "number", "choice", "multiple-choice", "drawing"]),
  pageSize: z.enum(["screen", "a4-portrait", "a4-landscape"]),
  useCharacter: z.boolean().default(false),
  personalizationMode: z.enum(["none", "self", "student"]).default("none"),
  targetStudentId: z.string().uuid().optional(),
}).strict().superRefine((input, context) => {
  if (input.personalizationMode === "student" && !input.targetStudentId) context.addIssue({ code: "custom", path: ["targetStudentId"], message: "対象の生徒を選択してください。" });
  if (input.personalizationMode !== "student" && input.targetStudentId) context.addIssue({ code: "custom", path: ["targetStudentId"], message: "対象生徒は個別調整時のみ指定できます。" });
});

export const answerPayloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: z.string().max(5000) }).strict(),
  z.object({ type: z.literal("number"), value: z.string().max(200) }).strict(),
  z.object({ type: z.literal("choice"), value: z.string().max(200) }).strict(),
  z.object({ type: z.literal("multiple-choice"), values: z.array(z.string().max(200)).max(30) }).strict(),
  z.object({ type: z.literal("drawing"), assetId: z.string().uuid() }).strict(),
]);

export const answerSubmissionSchema = z.object({
  questionId: z.string().min(1).max(200),
  answer: answerPayloadSchema,
}).strict();

export const drawingAnswerSchema = z.object({
  type: z.literal("drawing"),
  assetId: z.string().uuid(),
  recognizedText: z.string().max(5000).nullable().optional(),
  recognitionConfidence: z.number().min(0).max(1).nullable().optional(),
  interpretationNotes: z.string().max(2000).nullable().optional(),
}).strict();

export const evaluationSchema = z.object({
  verdict: z.enum(["correct", "mostly_correct", "needs_review", "incorrect"]),
  score: z.number().min(0).max(100),
  goodPoint: z.string().min(1).max(2000),
  improvement: z.string().min(1).max(2000),
  hint: z.string().max(2000).optional(),
  modelAnswer: z.string().max(5000).optional(),
}).strict();

export const handwritingRecognitionSchema = z.object({
  recognizedText: z.string().max(5000),
  confidence: z.number().min(0).max(1),
  interpretationNotes: z.string().max(2000),
}).strict();

export const aggregateFeedbackSchema = z.object({
  summary: z.string().min(1).max(3000),
  strengths: z.array(z.string().min(1).max(1000)).max(8),
  improvements: z.array(z.string().min(1).max(1000)).max(8),
  recommendedNextSteps: z.array(z.string().min(1).max(1000)).max(8),
  encouragement: z.string().min(1).max(1000),
  recommendedDifficulty: z.enum(["easier", "same", "harder"]),
}).strict();

export const learningProfileSummarySchema = z.object({
  gradeBand: z.string().max(80).optional(),
  recentSubjects: z.array(z.string().max(120)).max(8),
  weakUnits: z.array(z.string().max(160)).max(8),
  strongUnits: z.array(z.string().max(160)).max(8),
  recentAverageScore: z.number().min(0).max(100).optional(),
  commonlyMissedPatterns: z.array(z.string().max(300)).max(10),
  preferredPresentation: z.string().max(120).optional(),
  recentFeedbackSummary: z.array(z.string().max(500)).max(8),
}).strict();
export const characterDesignSchema = z.object({ name:z.string().min(1), colors:z.array(z.string()).min(1), personality:z.string(), motif:z.string(), likes:z.string(), mood:z.string(), visualDescription:z.string(), imageBrief:z.string() }).strict();
