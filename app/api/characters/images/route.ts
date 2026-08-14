import { NextResponse } from "next/server";
import { z } from "zod";
import { characterDesignSchema } from "@/features/materials/shared/schemas";
import { AiConfigurationError } from "@/lib/ai/errors";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateImage, getImageModel } from "@/lib/ai/image-provider";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError, apiServiceUnavailable } from "@/lib/http/api-error";
import { getCharacter } from "@/lib/materials";
import { saveVisualAsset } from "@/lib/storage/assets";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ characterId: z.string().uuid(), stage: z.enum(["egg", "child", "learning-partner"]), request: z.string().max(1000).default("") }).strict();
const threshold = { egg: 0, child: 100, "learning-partner": 300 } as const;

export async function POST(request: Request) {
  let designLog: string | null = null;
  let imageLog: string | null = null;
  try {
    const current = await requireApiRole(["personal", "student"]);
    const input = inputSchema.parse(await request.json());
    const character = await getCharacter(input.characterId);
    if (!character) return NextResponse.json({ error: "キャラクターが見つかりません。" }, { status: 404 });
    if (character.exp < threshold[input.stage]) return NextResponse.json({ error: `この進化には${threshold[input.stage]} EXPが必要です。` }, { status: 409 });
    const baseDesign = characterDesignSchema.parse(character.designJson);
    const textModel = getTextModel();
    const imageModel = getImageModel();
    designLog = await startGeneration({ userId: current.user.id, feature: "character-design", model: textModel, metadata: { characterId: character.id, stage: input.stage } });
    const design = await generateStructuredText({
      schema: characterDesignSchema,
      schemaName: "gakugaku_character_evolution",
      instructions: "元のキャラクターの色、性格、モチーフ、同一性を保ちながら、指定された成長段階のオリジナルデザインへ発展させてください。既存作品に似せません。",
      prompt: JSON.stringify({ currentDesign: baseDesign, targetStage: input.stage, request: input.request, imageRules: "正方形、1体、文字・数字・ロゴ・透かしなし、怖くない。" }),
    });
    await finishGeneration(designLog, true);
    imageLog = await startGeneration({ userId: current.user.id, feature: "character-image", model: imageModel, metadata: { characterId: character.id, stage: input.stage } });
    const generated = await generateImage({ purpose: input.stage, prompt: design.imageBrief, userId: current.user.id });
    const imageKey = crypto.randomUUID();
    const storagePath = `users/${current.user.id}/characters/${character.id}/${input.stage}/${imageKey}.webp`;
    const visualAssetId = await saveVisualAsset({ ownerId: current.user.id, kind: input.stage, storagePath, buffer: generated.buffer, width: generated.width, height: generated.height, generationType: "ai", metadata: { design, model: generated.model } });
    const db = await createClient();
    const characterAssetId = crypto.randomUUID();
    const { error } = await db.from("hub_character_assets").insert({ id: characterAssetId, character_id: character.id, owner_id: current.user.id, visual_asset_id: visualAssetId, stage: input.stage, storage_path: storagePath, generation_type: "ai", is_active: false });
    if (error) throw error;
    await finishGeneration(imageLog, true);
    return NextResponse.json({ characterAssetId, assetId: visualAssetId, stage: input.stage, design, previewUrl: `/api/assets/${visualAssetId}` }, { status: 201 });
  } catch (error) {
    if (designLog) await finishGeneration(designLog, false, error instanceof Error ? error.name : "unknown_error");
    if (imageLog) await finishGeneration(imageLog, false, error instanceof Error ? error.name : "unknown_error");
    if (error instanceof AiConfigurationError) return apiServiceUnavailable(error, "進化画像を生成できませんでした。管理者がAI設定を確認してください。");
    return apiError(error, "進化画像を生成できませんでした。");
  }
}
