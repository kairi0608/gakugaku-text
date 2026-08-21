import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ comment: z.string().max(4000).default("") }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await requireApiRole(["teacher"]);
    const { id } = await params;
    const input = schema.parse(await request.json().catch(() => ({})));
    const db = await createClient();
    const material = await db.from("hub_materials").select("id,owner_id,current_version_id,status").eq("id", id).maybeSingle();
    if (material.error) throw material.error;
    if (!material.data || (current.profile.role !== "admin" && material.data.owner_id !== current.user.id)) return NextResponse.json({ error: "確認できる教材が見つかりません。" }, { status: 404 });
    if (!material.data.current_version_id) return NextResponse.json({ error: "承認する教材バージョンがありません。" }, { status: 409 });
    const review = await db.from("hub_material_reviews").insert({ id: crypto.randomUUID(), material_version_id: material.data.current_version_id, reviewer_id: current.user.id, decision: "approved", comment: input.comment || null });
    if (review.error) throw review.error;
    const update = await db.from("hub_materials").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", id).eq("current_version_id", material.data.current_version_id);
    if (update.error) throw update.error;
    return NextResponse.json({ status: "approved", materialVersionId: material.data.current_version_id });
  } catch (error) {
    return apiError(error, "教材を承認できませんでした。承認済みとは表示していません。");
  }
}
