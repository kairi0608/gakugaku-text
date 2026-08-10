import { NextResponse } from "next/server";
import { z } from "zod";
import { AiConfigurationError } from "@/lib/ai/errors";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateImage, getImageModel } from "@/lib/ai/image-provider";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { saveVisualAsset } from "@/lib/storage/assets";

const schema = z.object({ request: z.string().trim().min(3).max(1000), audienceStage: z.enum(["elementary", "middle", "high", "adult"]), colors: z.string().trim().min(1).max(200), mood: z.string().trim().min(1).max(200) }).strict();

export async function POST(request: Request) {
  let logId: string | null = null;
  try {
    const current = await requireApiRole(["personal", "student", "teacher"]);
    const input = schema.parse(await request.json());
    const model = getImageModel();
    logId = await startGeneration({ userId: current.user.id, feature: "background", model, metadata: { audienceStage: input.audienceStage } });
    const generated = await generateImage({ purpose: "app-background", prompt: `対象: ${input.audienceStage}。希望: ${input.request}。色: ${input.colors}。雰囲気: ${input.mood}。`, userId: current.user.id, landscape: true });
    const assetKey = crypto.randomUUID();
    const storagePath = `users/${current.user.id}/backgrounds/${assetKey}.webp`;
    const assetId = await saveVisualAsset({ ownerId: current.user.id, kind: "app-background", storagePath, buffer: generated.buffer, width: generated.width, height: generated.height, generationType: "ai", metadata: { ...input, model: generated.model } });
    await finishGeneration(logId, true);
    return NextResponse.json({ assetId, previewUrl: `/api/assets/${assetId}` }, { status: 201 });
  } catch (error) {
    if (logId) await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    if (error instanceof AiConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    return apiError(error, "背景画像を生成できませんでした。");
  }
}
