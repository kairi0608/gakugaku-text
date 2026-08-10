import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ role: z.enum(["personal", "student", "teacher", "admin"]) }).strict();
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await requireApiRole(["admin"]);
    const input = schema.parse(await request.json());
    const { id } = await params;
    if (id === current.user.id && input.role !== "admin") return NextResponse.json({ error: "自分自身の管理者権限は解除できません。" }, { status: 409 });
    const { data, error } = await createAdminClient().from("profiles").update({ role: input.role, updated_at: new Date().toISOString() }).eq("id", id).select("id,role").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    return NextResponse.json({ profile: data });
  } catch (error) {
    return apiError(error, "ロールを更新できませんでした。");
  }
}
