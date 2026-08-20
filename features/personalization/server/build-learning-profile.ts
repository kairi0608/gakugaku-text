import "server-only";

import { learningProfileSummarySchema, materialDocumentSchema } from "@/features/materials/shared/schemas";
import type { LearningProfileSummary, MaterialDocument } from "@/features/materials/shared/types";
import type { UserRole } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

type AttemptEvidence = { id: string; materialVersionId: string; score: number | null };
type AnswerEvidence = { attemptId: string; questionId: string; isCorrect: boolean | null };
type VersionEvidence = { id: string; document: MaterialDocument };

export function summarizeLearningProfile(input: {
  gradeBand?: string | null;
  attempts: AttemptEvidence[];
  answers: AnswerEvidence[];
  versions: VersionEvidence[];
  feedback: string[];
}): LearningProfileSummary {
  const versionById = new Map(input.versions.map(item => [item.id, item.document]));
  const scored = input.attempts.filter(item => item.score !== null);
  const recentAverageScore = scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length) : undefined;
  const subjectCounts = new Map<string, number>();
  const formatCounts = new Map<string, number>();
  const unitScores = new Map<string, number[]>();

  for (const attempt of input.attempts) {
    const document = versionById.get(attempt.materialVersionId);
    if (!document) continue;
    subjectCounts.set(document.metadata.subject, (subjectCounts.get(document.metadata.subject) ?? 0) + 1);
    formatCounts.set(document.presentation.format, (formatCounts.get(document.presentation.format) ?? 0) + 1);
    if (attempt.score !== null) unitScores.set(document.metadata.unit, [...(unitScores.get(document.metadata.unit) ?? []), attempt.score]);
  }

  const unitAverages = [...unitScores].map(([unit, values]) => ({ unit, average: values.reduce((sum, value) => sum + value, 0) / values.length }));
  const attemptsById = new Map(input.attempts.map(item => [item.id, item]));
  const missed = input.answers.filter(item => item.isCorrect === false).flatMap(item => {
    const attempt = attemptsById.get(item.attemptId);
    const document = attempt ? versionById.get(attempt.materialVersionId) : undefined;
    const question = document?.questions.find(candidate => candidate.id === item.questionId);
    if (!document || !question) return [];
    return [`${document.metadata.subject}「${document.metadata.unit}」: ${question.prompt.slice(0, 180)}`];
  });
  const sortCounts = (values: Map<string, number>) => [...values].sort((a, b) => b[1] - a[1]).map(([value]) => value);

  return learningProfileSummarySchema.parse({
    gradeBand: input.gradeBand ?? undefined,
    recentSubjects: sortCounts(subjectCounts).slice(0, 8),
    weakUnits: unitAverages.filter(item => item.average < 70).sort((a, b) => a.average - b.average).map(item => item.unit).slice(0, 8),
    strongUnits: unitAverages.filter(item => item.average >= 85).sort((a, b) => b.average - a.average).map(item => item.unit).slice(0, 8),
    recentAverageScore,
    commonlyMissedPatterns: [...new Set(missed)].slice(0, 10),
    preferredPresentation: sortCounts(formatCounts)[0],
    recentFeedbackSummary: input.feedback.map(value => value.trim()).filter(Boolean).slice(0, 8),
  });
}

async function targetAttemptIds(targetUserId: string, requesterId: string, requesterRole: UserRole) {
  const db = await createClient();
  if (targetUserId === requesterId) return null;
  if (requesterRole === "admin") return null;
  if (requesterRole !== "teacher") throw new Error("他の利用者の学習履歴は利用できません。");
  const membership = await db.from("hub_classroom_members").select("classroom_id").eq("student_id", targetUserId).limit(30);
  if (membership.error) throw membership.error;
  const classroomIds = (membership.data ?? []).map(item => String(item.classroom_id));
  if (!classroomIds.length) throw new Error("担当クラスの生徒ではありません。");
  const ownedClassrooms = await db.from("hub_classrooms").select("id").eq("teacher_id", requesterId).in("id", classroomIds);
  if (ownedClassrooms.error) throw ownedClassrooms.error;
  const ownedIds = (ownedClassrooms.data ?? []).map(item => String(item.id));
  if (!ownedIds.length) throw new Error("担当クラスの生徒ではありません。");
  const assignments = await db.from("hub_assignments").select("id").in("classroom_id", ownedIds);
  if (assignments.error) throw assignments.error;
  const assignmentIds = (assignments.data ?? []).map(item => String(item.id));
  if (!assignmentIds.length) return [];
  const submissions = await db.from("hub_assignment_submissions").select("attempt_id").eq("student_id", targetUserId).in("assignment_id", assignmentIds).limit(30);
  if (submissions.error) throw submissions.error;
  return (submissions.data ?? []).map(item => String(item.attempt_id));
}

export async function buildLearningProfile(input: {
  requesterId: string;
  requesterRole: UserRole;
  targetUserId?: string;
}): Promise<LearningProfileSummary> {
  const targetUserId = input.targetUserId ?? input.requesterId;
  const db = await createClient();
  const allowedAttemptIds = input.requesterRole === "admin" && targetUserId !== input.requesterId ? [] : await targetAttemptIds(targetUserId, input.requesterId, input.requesterRole);
  const profileResult = await db.from("profiles").select("grade_band").eq("id", targetUserId).maybeSingle();
  if (profileResult.error) throw profileResult.error;

  let attemptsQuery = db.from("hub_attempts").select("id,material_version_id,score").order("started_at", { ascending: false }).limit(20);
  attemptsQuery = allowedAttemptIds === null ? attemptsQuery.eq("user_id", targetUserId) : attemptsQuery.in("id", allowedAttemptIds.length ? allowedAttemptIds : ["00000000-0000-0000-0000-000000000000"]);
  const attemptsResult = await attemptsQuery;
  if (attemptsResult.error) throw attemptsResult.error;
  const attempts = (attemptsResult.data ?? []).map(item => ({ id: String(item.id), materialVersionId: String(item.material_version_id), score: item.score === null ? null : Number(item.score) }));
  if (!attempts.length) return summarizeLearningProfile({ gradeBand: profileResult.data?.grade_band, attempts: [], answers: [], versions: [], feedback: [] });

  const versionIds = [...new Set(attempts.map(item => item.materialVersionId))];
  const attemptIds = attempts.map(item => item.id);
  const [versionsResult, answersResult, feedbackResult] = await Promise.all([
    db.from("hub_material_versions").select("id,document_json").in("id", versionIds),
    db.from("hub_answers").select("attempt_id,question_id,is_correct").in("attempt_id", attemptIds),
    db.from("hub_feedback").select("feedback_text").in("attempt_id", attemptIds).is("question_id", null).order("created_at", { ascending: false }).limit(8),
  ]);
  if (versionsResult.error) throw versionsResult.error;
  if (answersResult.error) throw answersResult.error;
  if (feedbackResult.error) throw feedbackResult.error;

  return summarizeLearningProfile({
    gradeBand: profileResult.data?.grade_band,
    attempts,
    versions: (versionsResult.data ?? []).flatMap(item => {
      const parsed = materialDocumentSchema.safeParse(item.document_json);
      return parsed.success ? [{ id: String(item.id), document: parsed.data }] : [];
    }),
    answers: (answersResult.data ?? []).map(item => ({ attemptId: String(item.attempt_id), questionId: String(item.question_id), isCorrect: item.is_correct })),
    feedback: (feedbackResult.data ?? []).map(item => String(item.feedback_text)),
  });
}
