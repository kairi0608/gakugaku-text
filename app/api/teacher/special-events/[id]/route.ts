import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ enabled: z.boolean() }).strict();
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await requireApiRole(["teacher"]); const { id } = await params; const input = schema.parse(await request.json()); const db = await createClient();
    let query = db.from("hub_special_events").update({ enabled: input.enabled }).eq("id", id);
    if (current.profile.role !== "admin") query = query.eq("teacher_id", current.user.id);
    const result = await query.select("id,enabled").maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return NextResponse.json({ error: "イベントが見つかりません。" }, { status: 404 });
    return NextResponse.json(result.data);
  } catch (error) { return apiError(error, "イベントの状態を変更できませんでした。"); }
}
