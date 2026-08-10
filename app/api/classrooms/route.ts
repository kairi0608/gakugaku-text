import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ name: z.string().trim().min(1).max(100) }).strict();
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function joinCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join("");
}

export async function GET() {
  try {
    await requireApiRole(["teacher"]);
    const db = await createClient();
    const { data, error } = await db.from("hub_classrooms").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ classrooms: data });
  } catch (error) {
    return apiError(error, "クラスを取得できませんでした。");
  }
}

export async function POST(request: Request) {
  try {
    const current = await requireApiRole(["teacher"]);
    const input = schema.parse(await request.json());
    const db = await createClient();
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = crypto.randomUUID();
      const code = joinCode();
      const result = await db.from("hub_classrooms").insert({ id, teacher_id: current.user.id, name: input.name, join_code: code }).select("*").single();
      if (!result.error) return NextResponse.json({ classroom: result.data }, { status: 201 });
      if (result.error.code !== "23505") throw result.error;
    }
    throw new Error("参加コードを発行できませんでした。");
  } catch (error) {
    return apiError(error, "クラスを作成できませんでした。");
  }
}
