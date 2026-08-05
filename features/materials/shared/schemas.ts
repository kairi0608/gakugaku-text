import { z } from "zod";

const area = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1) }).strict().refine(v => v.x + v.width <= 1 && v.y + v.height <= 1, "回答領域が教材面を超えています");
const choice = z.object({ id: z.string().min(1), label: z.string().min(1) }).strict();
const question = z.object({ id: z.string().min(1), pageId: z.string().min(1), order: z.number().int().nonnegative(), prompt: z.string().min(1), instructions: z.string().optional(), answerType: z.enum(["text", "number", "choice", "multiple-choice", "drawing"]), choices: z.array(choice).optional(), correctAnswer: z.string().min(1), explanation: z.string().min(1), answerArea: area.optional() }).strict();
export const materialDocumentSchema = z.object({
  version: z.literal(1),
  metadata: z.object({ title: z.string().min(1), grade: z.string().min(1), subject: z.string().min(1), unit: z.string().min(1), objective: z.string().min(1), difficulty: z.enum(["easy", "standard", "challenge"]), description: z.string().optional() }).strict(),
  presentation: z.object({ mode: z.enum(["safe-composite", "full-image"]), format: z.enum(["simple", "adventure", "comic", "picture-book", "game-card", "worksheet-poster"]), pageSize: z.enum(["screen", "a4-portrait", "a4-landscape"]) }).strict(),
  pages: z.array(z.object({ id: z.string().min(1), pageNumber: z.number().int().positive(), backgroundAssetId: z.string().optional(), altText: z.string().min(1) }).strict()).min(1),
  questions: z.array(question).min(1),
  feedbackPolicy: z.object({ tone: z.enum(["gentle", "standard", "detailed"]), revealAnswer: z.boolean(), allowHints: z.boolean(), maxHints: z.number().int().nonnegative().optional() }).strict(),
  accessibility: z.object({ highContrast: z.boolean(), largeText: z.boolean(), readingSupport: z.boolean(), imageDescription: z.string().min(1) }).strict(),
}).strict().superRefine((doc, ctx) => { const pages = new Set(doc.pages.map(p => p.id)); doc.questions.forEach((q, i) => { if (!pages.has(q.pageId)) ctx.addIssue({ code: "custom", path: ["questions", i, "pageId"], message: "存在しないページです" }); if (["choice", "multiple-choice"].includes(q.answerType) && !q.choices?.length) ctx.addIssue({ code: "custom", path: ["questions", i, "choices"], message: "選択肢が必要です" }); }); });
export const createDraftSchema = z.object({ idempotencyKey: z.string().min(8).max(200), requestSummary: z.string().min(1).max(2000), materialManifest: materialDocumentSchema, source: z.literal("custom-gpt") }).strict();
