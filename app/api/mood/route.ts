import { NextResponse } from "next/server";
import { z } from "zod";
import { dailyMoodSchema } from "@/features/learning-session/shared/schemas";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";
import { localDateAt, validateTimeZone } from "@/lib/time/local-date";

const schema = z.object({ mood: dailyMoodSchema, timezone: z.string().max(80).optional() }).strict();

export async function GET() {
  try {
    const current = await requireApiRole(["personal", "student"]);
    const db = await createClient();
    const settings = await db.from("hub_user_settings").select("timezone").eq("user_id", current.user.id).maybeSingle();
    const timezone = validateTimeZone(settings.data?.timezone);
    const localDate = localDateAt(new Date(), timezone);
    const mood = await db.from("hub_daily_moods").select("mood,local_date,timezone,updated_at").eq("user_id", current.user.id).eq("local_date", localDate).maybeSingle();
    if (mood.error) throw mood.error;
    return NextResponse.json({ mood: mood.data?.mood ?? null, localDate, timezone });
  } catch (error) {
    return apiError(error, "今日の気分を取得できませんでした。");
  }
}

export async function POST(request: Request) {
  try {
    const current = await requireApiRole(["personal", "student"]);
    const input = schema.parse(await request.json());
    const db = await createClient();
    const timezone = validateTimeZone(input.timezone);
    const localDate = localDateAt(new Date(), timezone);
    const result = await db.from("hub_daily_moods").upsert({ user_id: current.user.id, local_date: localDate, timezone, mood: input.mood, updated_at: new Date().toISOString() }, { onConflict: "user_id,local_date" }).select("mood,local_date").single();
    if (result.error) throw result.error;
    return NextResponse.json(result.data);
  } catch (error) {
    return apiError(error, "今日の気分を保存できませんでした。学習はそのまま始められます。");
  }
}
