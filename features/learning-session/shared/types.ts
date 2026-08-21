import type { z } from "zod";
import type { adaptiveQuestionSchema, dailyMoodSchema, interestCategorySchema, learningContextSchema, learningSessionCreateSchema, presentationFamilySchema, setFeedbackSchema, whatIfQuestionSchema } from "./schemas";

export type PresentationFamily = z.infer<typeof presentationFamilySchema>;
export type InterestCategory = z.infer<typeof interestCategorySchema>;
export type DailyMood = z.infer<typeof dailyMoodSchema>;
export type AdaptiveQuestion = z.infer<typeof adaptiveQuestionSchema>;
export type LearningSessionCreate = z.infer<typeof learningSessionCreateSchema>;
export type LearningContext = z.infer<typeof learningContextSchema>;
export type SetFeedback = z.infer<typeof setFeedbackSchema>;
export type WhatIfQuestion = z.infer<typeof whatIfQuestionSchema>;
