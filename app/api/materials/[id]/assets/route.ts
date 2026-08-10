import { NextResponse } from "next/server";
import { z } from "zod";
import { AiConfigurationError } from "@/lib/ai/errors";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateImage, getImageModel } from "@/lib/ai/image-provider";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { getMaterial, ownsMaterial, saveMaterial } from "@/lib/materials";
import { attachVisualAssetsToMaterial, saveVisualAsset } from "@/lib/storage/assets";

const inputSchema = z.object({
  assetType: z.enum(["background", "scene", "character", "item", "decoration"]),
  targetId: z.string().max(100).optional(),
  request: z.string().max(1000).default(""),
}).strict();
const briefSchema = z.object({ prompt: z.string().min(20).max(1200), alt: z.string().min(1).max(200) }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let logId: string | null = null;
  try {
    const current = await requireApiRole(["personal", "student", "teacher"]);
    const input = inputSchema.parse(await request.json());
    const { id } = await params;
    if (!await ownsMaterial(id, current.user.id)) return NextResponse.json({ error: "この教材を変更する権限がありません。" }, { status: 403 });
    const material = await getMaterial(id);
    if (!material) return NextResponse.json({ error: "教材が見つかりません。" }, { status: 404 });
    const textModel = getTextModel();
    const imageModel = getImageModel();
    logId = await startGeneration({ userId: current.user.id, feature: "material-image", model: imageModel, metadata: { materialId: id, assetType: input.assetType, textModel } });
    const brief = await generateStructuredText({
      schema: briefSchema,
      schemaName: "gakugaku_material_image_brief",
      instructions: "教材内容を正確に補助する、安全で年齢相応な画像設計を日本語で返してください。画像内の文字、数字、ロゴ、透かしは要求しません。",
      prompt: JSON.stringify({ material: material.document.metadata, assetType: input.assetType, request: input.request }),
    });
    const purpose = input.assetType === "background" ? "material-background" : "material-scene";
    const generated = await generateImage({ purpose, prompt: brief.prompt, userId: current.user.id, landscape: purpose === "material-background" });
    const assetKey = crypto.randomUUID();
    const path = `users/${current.user.id}/materials/${id}/${material.version.versionNumber + 1}/${assetKey}.webp`;
    const assetId = await saveVisualAsset({ ownerId: current.user.id, kind: purpose, storagePath: path, buffer: generated.buffer, width: generated.width, height: generated.height, generationType: "ai", metadata: { alt: brief.alt, model: generated.model } });
    const pages = material.document.pages.map((page, pageIndex) => {
      if (purpose === "material-background" && (page.id === input.targetId || (!input.targetId && pageIndex === 0))) return { ...page, backgroundAssetId: assetId };
      if (purpose !== "material-background") {
        const targetIndex = page.blocks.findIndex(block => block.id === input.targetId);
        if (targetIndex >= 0) return { ...page, blocks: page.blocks.map((block, index) => index === targetIndex ? { id: block.id, type: "illustration" as const, assetId, alt: brief.alt } : block) };
        if (!input.targetId && pageIndex === 0) return { ...page, blocks: [...page.blocks, { id: `asset-${assetKey}`, type: "illustration" as const, assetId, alt: brief.alt }] };
      }
      return page;
    });
    await saveMaterial({ ...material.document, pages }, id);
    const saved = await getMaterial(id);
    if (!saved) throw new Error("更新した教材を確認できませんでした。");
    await attachVisualAssetsToMaterial([assetId], id, saved.version.id);
    await finishGeneration(logId, true);
    return NextResponse.json({ assetId, materialId: id, versionNumber: material.version.versionNumber + 1 }, { status: 201 });
  } catch (error) {
    if (logId) await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    if (error instanceof AiConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    return apiError(error, "教材画像を生成できませんでした。");
  }
}
