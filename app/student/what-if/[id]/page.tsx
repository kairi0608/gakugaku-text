import { notFound } from "next/navigation";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { whatIfQuestionSchema } from "@/features/learning-session/shared/schemas";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WhatIfForm } from "./WhatIfForm";

export const dynamic = "force-dynamic";
export default async function WhatIfPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("student"); const { id } = await params; const db = await createClient(); const now = new Date().toISOString();
  await db.rpc("hub_record_daily_login");
  const result = await db.from("hub_special_events").select("id,title,start_at,end_at,enabled,trigger_type,trigger_config,what_if_json,presentation_family").eq("id", id).maybeSingle();
  if (result.error || !result.data || !result.data.enabled || result.data.start_at > now || (result.data.end_at && result.data.end_at <= now)) notFound();
  if (result.data.trigger_type === "login-streak") { const streak = await db.rpc("hub_current_login_streak"); const config = result.data.trigger_config as { streakDays?: unknown }; if (streak.error || Number(streak.data ?? 0) < Number(config?.streakDays ?? 7)) notFound(); }
  const question = whatIfQuestionSchema.safeParse(result.data.what_if_json); if (!question.success) notFound();
  return <main className="shell what-if-page"><PageHeader eyebrow="SPECIAL EVENT · WHAT IF" title={question.data.title || result.data.title} description="正解は一つではありません。自分の仮説と理由を自由に考えてみよう。" /><div className="what-if-layout"><AppCard className={`what-if-question ${result.data.presentation_family}`}><span className="what-if-visual" aria-hidden="true">{result.data.presentation_family === "real" ? "🔎" : "✨"}</span><h2>{question.data.question}</h2>{question.data.visualBrief && <p className="visual-brief">イメージ: {question.data.visualBrief}</p>}{question.data.thinkingHints.length > 0 && <details><summary>考えるヒント</summary><ul>{question.data.thinkingHints.map(hint => <li key={hint}>{hint}</li>)}</ul></details>}{question.data.learningConnections.length > 0 && <div className="connection-tags">{question.data.learningConnections.map(connection => <span key={`${connection.subject}-${connection.concept}`}>{connection.subject}: {connection.concept}</span>)}</div>}</AppCard><AppCard><WhatIfForm eventId={id} /></AppCard></div></main>;
}
