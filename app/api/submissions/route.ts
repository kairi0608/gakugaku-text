import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ assignmentId: z.string().uuid(), attemptId: z.string().uuid() }).strict();

export async function POST(request: Request) {
  try {
    const current = await requireApiRole(["student"]);
    const input = schema.parse(await request.json());
    const db = await createClient();
    const { data: attempt } = await db.from("hub_attempts").select("id,status").eq("id", input.attemptId).eq("status", "completed").maybeSingle();
    if (!attempt) return NextResponse.json({ error: "提出できる学習記録が見つかりません。" }, { status: 404 });
    const now = new Date().toISOString();
    const { data, error } = await db.from("hub_assignment_submissions").upsert({ id: crypto.randomUUID(), assignment_id: input.assignmentId, student_id: current.user.id, attempt_id: attempt.id, status: "submitted", submitted_at: now, updated_at: now }, { onConflict: "assignment_id,student_id" }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ submission: data }, { status: 201 });
  } catch (error) {
    return apiError(error, "課題を提出できませんでした。");
  }
}
