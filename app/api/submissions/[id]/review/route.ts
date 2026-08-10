import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ feedback: z.string().trim().min(1).max(5000), score: z.number().min(0).max(100).nullable().optional() }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiRole(["teacher"]);
    const input = schema.parse(await request.json());
    const { id } = await params;
    const db = await createClient();
    const now = new Date().toISOString();
    const { data, error } = await db.from("hub_assignment_submissions").update({ teacher_feedback: input.feedback, teacher_score: input.score ?? null, status: "reviewed", reviewed_at: now, updated_at: now }).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "提出が見つかりません。" }, { status: 404 });
    const { error: feedbackError } = await db.from("hub_feedback").insert({ id: crypto.randomUUID(), attempt_id: data.attempt_id, source: "teacher", feedback_text: input.feedback, score: input.score ?? null, created_at: now });
    if (feedbackError) throw feedbackError;
    return NextResponse.json({ submission: data });
  } catch (error) {
    return apiError(error, "提出を確認できませんでした。");
  }
}
