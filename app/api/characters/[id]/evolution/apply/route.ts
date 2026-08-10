import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ characterAssetId: z.string().uuid() }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiRole(["personal", "student"]);
    const input = inputSchema.parse(await request.json());
    const { id } = await params;
    const db = await createClient();
    const { data: asset } = await db.from("hub_character_assets").select("character_id").eq("id", input.characterAssetId).maybeSingle();
    if (!asset || asset.character_id !== id) return NextResponse.json({ error: "進化画像が見つかりません。" }, { status: 404 });
    const { data: stage, error } = await db.rpc("hub_apply_character_asset", { p_character_asset_id: input.characterAssetId });
    if (error) throw error;
    return NextResponse.json({ characterId: id, stage });
  } catch (error) {
    return apiError(error, "進化画像を適用できませんでした。");
  }
}
