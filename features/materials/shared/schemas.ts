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

export const generationInputSchema = z.object({ grade:z.string().min(1), subject:z.string().min(1), unit:z.string().min(1), difficulty:z.enum(["easy","standard","challenge"]), questionCount:z.coerce.number().int().min(1).max(12), format:z.enum(["simple","visual-guide","adventure","comic","picture-book","game-card","worksheet-poster"]), request:z.string().max(2000), avoid:z.string().max(500), textAmount:z.enum(["short","standard","long"]), imageAmount:z.enum(["few","standard","many"]), answerType:z.enum(["text","number","choice","multiple-choice","drawing"]), pageSize:z.enum(["screen","a4-portrait","a4-landscape"]), useCharacter:z.boolean().default(false) }).strict();

export const evaluationSchema = z.object({ verdict:z.enum(["correct","partial","incorrect"]), score:z.number().min(0).max(100), goodPoint:z.string(), improvement:z.string(), hint:z.string(), modelAnswer:z.string().optional() }).strict();
export const characterDesignSchema = z.object({ name:z.string().min(1), colors:z.array(z.string()).min(1), personality:z.string(), motif:z.string(), likes:z.string(), mood:z.string(), visualDescription:z.string(), imageBrief:z.string() }).strict();
