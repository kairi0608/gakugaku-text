import "server-only";

import { learningContextSchema } from "../shared/schemas";
import type { DailyMood, InterestCategory, LearningContext, PresentationFamily } from "../shared/types";
import { buildLearningProfile } from "@/features/personalization/server/build-learning-profile";
import { createClient } from "@/lib/supabase/server";

export function moodGuidance(mood: DailyMood | null) {
  if (mood === "very-good") return ["標準から少し挑戦的な問題を含める"];
  if (mood === "tired") return ["典型問題を優先する", "説明と問題文を短くする", "3問セットも提案する"];
  if (mood === "low") return ["最初は取り組みやすい典型問題にする", "文章量を減らす", "視覚的な手掛かりを増やす"];
  return ["標準的な難易度と文章量を維持する"];
}

export async function buildLearningContext(input: {
  userId: string;
  role: "personal" | "student" | "teacher" | "admin";
  mood: DailyMood | null;
  presentationFamily: PresentationFamily;
  interestCategory: InterestCategory;
  questionCount: 3 | 5 | 10;
  difficulty: "easy" | "standard" | "challenge";
}): Promise<LearningContext> {
  const profile = await buildLearningProfile({ requesterId: input.userId, requesterRole: input.role, targetUserId: input.userId });
  const db = await createClient();
  const sessions = await db.from("hub_learning_sessions").select("subject,unit,score").eq("user_id", input.userId).eq("status", "completed").eq("mode", "self-practice").order("completed_at", { ascending: false }).limit(12);
  if (sessions.error) throw sessions.error;
  const scoredSessions = (sessions.data ?? []).filter(item => item.score !== null);
  const sessionAverage = scoredSessions.length ? Math.round(scoredSessions.reduce((sum, item) => sum + Number(item.score), 0) / scoredSessions.length) : undefined;
  const recentPerformance = profile.recentAverageScore === undefined ? sessionAverage : sessionAverage === undefined ? profile.recentAverageScore : Math.round((profile.recentAverageScore + sessionAverage) / 2);
  const sessionWeak = scoredSessions.filter(item => Number(item.score) < 70).map(item => `${item.subject ?? "学習"}「${item.unit ?? "単元"}」`);
  const sessionStrong = scoredSessions.filter(item => Number(item.score) >= 85).map(item => `${item.subject ?? "学習"}「${item.unit ?? "単元"}」`);
  return learningContextSchema.parse({
    gradeBand: profile.gradeBand,
    recentPerformance,
    weakPatterns: [...new Set([...sessionWeak, ...profile.weakUnits, ...profile.commonlyMissedPatterns])].slice(0, 8),
    strongPatterns: [...new Set([...sessionStrong, ...profile.strongUnits])].slice(0, 8),
    mood: input.mood,
    presentationFamily: input.presentationFamily,
    interestCategory: input.interestCategory,
    questionCount: input.questionCount,
    difficulty: input.difficulty,
    moodGuidance: moodGuidance(input.mood),
  });
}
