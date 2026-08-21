import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewDecisionSchema } from "@/features/learning-session/shared/schemas";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("begin") }).strict(),
  z.object({ action: z.literal("archive") }).strict(),
  z.object({ action: z.literal("decision"), decision: reviewDecisionSchema.exclude(["approved"]), comment: z.string().max(4000).default("") }).strict(),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await requireApiRole(["teacher"]);
    const { id } = await params;
    const input = schema.parse(await request.json());
    const db = await createClient();
    const material = await db.from("hub_materials").select("id,owner_id,current_version_id").eq("id", id).maybeSingle();
    if (material.error) throw material.error;
    if (!material.data || (current.profile.role !== "admin" && material.data.owner_id !== current.user.id)) return NextResponse.json({ error: "確認できる教材が見つかりません。" }, { status: 404 });
    if (input.action === "begin") {
      const update = await db.from("hub_materials").update({ status: "reviewing", updated_at: new Date().toISOString() }).eq("id", id);
      if (update.error) throw update.error;
      return NextResponse.json({ status: "reviewing" });
    }
    if (input.action === "archive") {
      const update = await db.from("hub_materials").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", id);
      if (update.error) throw update.error;
      return NextResponse.json({ status: "archived" });
    }
    if (!material.data.current_version_id) return NextResponse.json({ error: "確認対象のバージョンがありません。" }, { status: 409 });
    const review = await db.from("hub_material_reviews").insert({ id: crypto.randomUUID(), material_version_id: material.data.current_version_id, reviewer_id: current.user.id, decision: input.decision, comment: input.comment || null });
    if (review.error) throw review.error;
    const update = await db.from("hub_materials").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", id);
    if (update.error) throw update.error;
    return NextResponse.json({ status: "draft", decision: input.decision });
  } catch (error) {
    return apiError(error, "教材の確認結果を保存できませんでした。");
  }
}
