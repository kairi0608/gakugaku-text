import { NextResponse } from "next/server";
import { getAvailableSpecialEvent } from "@/features/special-events/server/available-event";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const current = await requireApiRole(["student"]); const db = await createClient(); await db.rpc("hub_record_daily_login");
    return NextResponse.json({ event: await getAvailableSpecialEvent(current.user.id) });
  } catch (error) { return apiError(error, "現在の特別イベントを取得できませんでした。"); }
}
