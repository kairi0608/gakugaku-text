import { NextResponse } from "next/server";
import { z } from "zod";
import { interestCategorySchema, presentationFamilySchema } from "@/features/learning-session/shared/schemas";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";
import { validateTimeZone } from "@/lib/time/local-date";

const schema = z.object({ presentationFamily: presentationFamilySchema, interestCategory: interestCategorySchema, timezone: z.string().max(80).optional() }).strict();

export async function POST(request: Request) {
  try {
    const current = await requireApiRole(["personal", "student", "teacher"]);
    const input = schema.parse(await request.json());
    const db = await createClient();
    const result = await db.from("hub_user_settings").upsert({ user_id: current.user.id, presentation_family: input.presentationFamily, interest_category: input.interestCategory, timezone: validateTimeZone(input.timezone), updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("presentation_family,interest_category,timezone").single();
    if (result.error) throw result.error;
    return NextResponse.json({ presentationFamily: result.data.presentation_family, interestCategory: result.data.interest_category, timezone: result.data.timezone });
  } catch (error) {
    return apiError(error, "見せ方の設定を保存できませんでした。");
  }
}
