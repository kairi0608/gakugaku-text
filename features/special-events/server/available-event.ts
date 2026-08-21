import "server-only";

import { whatIfQuestionSchema } from "@/features/learning-session/shared/schemas";
import { createClient } from "@/lib/supabase/server";

export async function getAvailableSpecialEvent(userId: string) {
  const db = await createClient();
  const now = new Date().toISOString();
  const [events, participations, streakResult] = await Promise.all([
    db.from("hub_special_events").select("id,title,start_at,end_at,trigger_type,trigger_config,what_if_json,presentation_family").eq("enabled", true).lte("start_at", now).or(`end_at.is.null,end_at.gt.${now}`).order("start_at", { ascending: false }).limit(12),
    db.from("hub_what_if_participations").select("event_id").eq("user_id", userId),
    db.rpc("hub_current_login_streak"),
  ]);
  if (events.error) throw events.error;
  if (participations.error) throw participations.error;
  const completed = new Set((participations.data ?? []).map(row => row.event_id));
  const streak = Number(streakResult.data ?? 0);
  for (const event of events.data ?? []) {
    if (completed.has(event.id)) continue;
    const config = (event.trigger_config ?? {}) as { streakDays?: unknown };
    if (event.trigger_type === "login-streak" && streak < Number(config.streakDays ?? 7)) continue;
    const parsed = whatIfQuestionSchema.safeParse(event.what_if_json);
    if (!parsed.success) continue;
    return { id: event.id, title: event.title, question: parsed.data, presentationFamily: event.presentation_family, triggerType: event.trigger_type, streak };
  }
  return null;
}
