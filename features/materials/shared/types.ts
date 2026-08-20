import type { z } from "zod";
import type { aggregateFeedbackSchema, answerPayloadSchema, evaluationSchema, learningProfileSummarySchema, materialDocumentSchema } from "./schemas";

export type MaterialDocument = z.infer<typeof materialDocumentSchema>;
export type MaterialBlock = MaterialDocument["pages"][number]["blocks"][number];
export type MaterialQuestion = MaterialDocument["questions"][number];
export type AnswerPayload = z.infer<typeof answerPayloadSchema>;
export type QuestionEvaluation = z.infer<typeof evaluationSchema>;
export type AggregateFeedback = z.infer<typeof aggregateFeedbackSchema>;
export type LearningProfileSummary = z.infer<typeof learningProfileSummarySchema>;
