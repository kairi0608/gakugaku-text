import { NextResponse } from "next/server";
import { z } from "zod";
import { characterDesignSchema } from "@/features/materials/shared/schemas";
import { AiConfigurationError } from "@/lib/ai/errors";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateImage, getImageModel } from "@/lib/ai/image-provider";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createCharacter } from "@/lib/materials";
import { saveVisualAsset } from "@/lib/storage/assets";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ name: z.string().trim().min(1).max(40), favoriteColor: z.string().min(1).max(120), personality: z.string().min(1).max(120), motif: z.string().min(1).max(120), likes: z.string().min(1).max(120), mood: z.string().min(1).max(120), request: z.string().max(1000) }).strict();

export async function POST(request: Request) {
  let designLog: string | null = null;
  let imageLog: string | null = null;
  let characterId: string | null = null;
  let storagePath: string | null = null;
  try {
    const current = await requireApiRole(["personal", "student"]);
    const input = inputSchema.parse(await request.json());
    const textModel = getTextModel();
    const imageModel = getImageModel();
    designLog = await startGeneration({ userId: current.user.id, feature: "character-design", model: textModel, metadata: { name: input.name } });
    const design = await generateStructuredText({
      schema: characterDesignSchema,
      schemaName: "gakugaku_character_design",
      instructions: "学習者と長く成長できる、完全にオリジナルで安全なキャラクターデザインを日本語で作ってください。既存作品や著名キャラクターに似せません。",
      prompt: JSON.stringify({ ...input, stage: "egg", imageRules: "タマゴまたは繭の姿だけ。完成した人物を描かない。正方形、1体、文字・数字・ロゴ・透かしなし、怖くない。" }),
    });
    characterId = await createCharacter({ name: design.name, design });
    await finishGeneration(designLog, true);
    imageLog = await startGeneration({ userId: current.user.id, feature: "character-image", model: imageModel, metadata: { characterId, stage: "egg" } });
    const generated = await generateImage({ purpose: "egg", prompt: design.imageBrief, userId: current.user.id });
    const imageKey = crypto.randomUUID();
    storagePath = `users/${current.user.id}/characters/${characterId}/egg/${imageKey}.webp`;
    const visualAssetId = await saveVisualAsset({ ownerId: current.user.id, kind: "egg", storagePath, buffer: generated.buffer, width: generated.width, height: generated.height, generationType: "ai", metadata: { design, model: generated.model } });
    const db = await createClient();
    const characterAssetId = crypto.randomUUID();
    const { error } = await db.from("hub_character_assets").insert({ id: characterAssetId, character_id: characterId, owner_id: current.user.id, visual_asset_id: visualAssetId, stage: "egg", storage_path: storagePath, generation_type: "ai", is_active: true });
    if (error) throw error;
    await finishGeneration(imageLog, true);
    return NextResponse.json({ id: characterId, design, assetId: visualAssetId, characterAssetId }, { status: 201 });
  } catch (error) {
    if (designLog) await finishGeneration(designLog, false, error instanceof Error ? error.name : "unknown_error");
    if (imageLog) await finishGeneration(imageLog, false, error instanceof Error ? error.name : "unknown_error");
    if (characterId) {
      const db = await createClient().catch(() => null);
      if (db) {
        await db.from("hub_characters").delete().eq("id", characterId);
        if (storagePath) await db.storage.from("gakugaku-assets").remove([storagePath]);
      }
    }
    if (error instanceof AiConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    return apiError(error, "キャラクターとタマゴ画像を生成できませんでした。");
  }
}
