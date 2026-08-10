import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ joinCode: z.string().trim().min(8).max(10).transform(value => value.toUpperCase()) }).strict();

export async function POST(request: Request) {
  try {
    await requireApiRole(["student"]);
    const input = schema.parse(await request.json());
    const db = await createClient();
    const { data, error } = await db.rpc("hub_join_classroom", { p_join_code: input.joinCode });
    if (error) throw error;
    return NextResponse.json({ classroomId: data }, { status: 201 });
  } catch (error) {
    return apiError(error, "クラスに参加できませんでした。参加コードを確認してください。");
  }
}
