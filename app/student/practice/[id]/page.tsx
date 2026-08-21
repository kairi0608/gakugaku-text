import { notFound } from "next/navigation";
import { adaptiveQuestionSchema, setFeedbackSchema } from "@/features/learning-session/shared/schemas";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { SessionGame } from "./SessionGame";

export const dynamic = "force-dynamic";

export default async function SessionGamePage({ params }: { params: Promise<{ id: string }> }) {
  const current = await requireRole("student");
  const { id } = await params;
  const db = await createClient();
  const session = await db.from("hub_learning_sessions").select("*").eq("id", id).maybeSingle();
  if (session.error) throw session.error;
  if (!session.data || session.data.user_id !== current.user.id || session.data.mode !== "self-practice") notFound();
  const latest = await db.from("hub_session_questions").select("question_json,answered_at").eq("session_id", id).order("order_number", { ascending: false }).limit(1).maybeSingle();
  if (latest.error) throw latest.error;
  const question = latest.data && !latest.data.answered_at ? adaptiveQuestionSchema.parse(latest.data.question_json) : undefined;
  const feedbackResult = setFeedbackSchema.safeParse(session.data.feedback_json);
  return <main className="shell game-page"><SessionGame initialSession={{ id, status: session.data.status, target: Number(session.data.target_question_count), completed: Number(session.data.completed_question_count), score: session.data.score === null ? null : Number(session.data.score), exp: Number(session.data.exp_awarded ?? 0), feedbackStatus: String(session.data.feedback_status) }} initialQuestion={question} initialFeedback={feedbackResult.success ? feedbackResult.data : undefined} /></main>;
}
