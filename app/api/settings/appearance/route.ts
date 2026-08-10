import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ assetId: z.string().uuid().nullable(), fit: z.enum(["cover", "contain"]), position: z.enum(["center", "top", "bottom", "left", "right"]), overlayStrength: z.number().min(0.55).max(0.9), blur: z.number().int().min(0).max(20) }).strict();

export async function GET() {
  try {
    const current = await requireApiUser();
    const db = await createClient();
    const { data, error } = await db.from("hub_user_settings").select("*").eq("user_id", current.user.id).maybeSingle();
    if (error) throw error;
    if (!data?.active_background_asset_id) return NextResponse.json({ assetId: null, imageUrl: null, fit: data?.background_fit ?? "cover", position: data?.background_position ?? "center", overlayStrength: Number(data?.background_overlay ?? 0.64), blur: Number(data?.background_blur ?? 0) });
    const { data: asset } = await db.from("hub_visual_assets").select("storage_path").eq("id", data.active_background_asset_id).maybeSingle();
    if (!asset) return NextResponse.json({ assetId: null, imageUrl: null, fit: "cover", position: "center", overlayStrength: 0.64, blur: 0 });
    const signed = await db.storage.from("gakugaku-assets").createSignedUrl(asset.storage_path, 900);
    if (signed.error) throw signed.error;
    return NextResponse.json({ assetId: data.active_background_asset_id, imageUrl: signed.data.signedUrl, fit: data.background_fit, position: data.background_position, overlayStrength: Number(data.background_overlay), blur: Number(data.background_blur) }, { headers: { "cache-control": "private, max-age=300" } });
  } catch (error) {
    return apiError(error, "背景設定を取得できませんでした。");
  }
}

export async function PATCH(request: Request) {
  try {
    const current = await requireApiUser();
    const input = schema.parse(await request.json());
    const db = await createClient();
    if (input.assetId) {
      const { data: asset } = await db.from("hub_visual_assets").select("id,kind").eq("id", input.assetId).eq("kind", "app-background").maybeSingle();
      if (!asset) return NextResponse.json({ error: "背景画像が見つかりません。" }, { status: 404 });
    }
    const { error } = await db.from("hub_user_settings").upsert({ user_id: current.user.id, active_background_asset_id: input.assetId, background_fit: input.fit, background_position: input.position, background_overlay: input.overlayStrength, background_blur: input.blur, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch (error) {
    return apiError(error, "背景設定を保存できませんでした。");
  }
}
