import { z } from "zod";
import { materialBlockSchema, materialDocumentSchema } from "../../materials/shared/schemas";
import type { MaterialDocument } from "../../materials/shared/types";

// OpenAI Structured Outputs requires every property to be listed in `required`.
// Nullable fields are converted back to the optional fields used by the app.
const aiQuestionSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  order: z.number().int().positive(),
  title: z.string().nullable(),
  narrative: z.string().nullable(),
  prompt: z.string().min(1),
  instructions: z.string().nullable(),
  answerType: z.enum(["text", "number", "choice", "multiple-choice", "drawing"]),
  choices: z.array(z.object({ id: z.string(), label: z.string() }).strict()),
  correctAnswer: z.string(),
  explanation: z.string(),
}).strict();

export const aiMaterialDocumentSchema = z.object({
  version: z.literal(1),
  metadata: z.object({
    title: z.string(),
    grade: z.string(),
    subject: z.string(),
    unit: z.string(),
    objective: z.string(),
    difficulty: z.enum(["easy", "standard", "challenge"]),
    description: z.string().nullable(),
  }).strict(),
  presentation: z.object({
    format: z.enum(["simple", "visual-guide", "adventure", "comic", "picture-book", "game-card", "worksheet-poster"]),
    pageSize: z.enum(["screen", "a4-portrait", "a4-landscape"]),
    visualTheme: z.string(),
    colorPalette: z.array(z.string()).min(2),
  }).strict(),
  pages: z.array(z.object({
    id: z.string(),
    pageNumber: z.number().int().positive(),
    backgroundAssetId: z.string().nullable(),
    blocks: z.array(materialBlockSchema),
  }).strict()).min(1),
  questions: z.array(aiQuestionSchema).min(1),
  feedbackPolicy: z.object({
    tone: z.enum(["gentle", "standard", "detailed"]),
    revealAnswer: z.boolean(),
    allowHints: z.boolean(),
    maxHints: z.number().int().nonnegative().nullable(),
  }).strict(),
  accessibility: z.object({
    highContrast: z.boolean(),
    largeText: z.boolean(),
    readingSupport: z.boolean(),
    imageDescription: z.string(),
  }).strict(),
}).strict();

export function fromAiMaterialDocument(value: z.infer<typeof aiMaterialDocumentSchema>): MaterialDocument {
  return materialDocumentSchema.parse({
    ...value,
    metadata: {
      ...value.metadata,
      description: value.metadata.description ?? undefined,
    },
    pages: value.pages.map(page => ({
      ...page,
      backgroundAssetId: page.backgroundAssetId ?? undefined,
    })),
    questions: value.questions.map(question => ({
      ...question,
      title: question.title ?? undefined,
      narrative: question.narrative ?? undefined,
      instructions: question.instructions ?? undefined,
      choices: question.choices.length ? question.choices : undefined,
    })),
    feedbackPolicy: {
      ...value.feedbackPolicy,
      maxHints: value.feedbackPolicy.maxHints ?? undefined,
    },
  });
}
