import "server-only";

import { z } from "zod";
import type { MaterialDocument } from "@/features/materials/shared/types";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateImage, getImageModel } from "@/lib/ai/image-provider";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { createMaterialDraft, deleteEmptyMaterialDraft, getMaterial, saveMaterial, type GenerationInput } from "@/lib/materials";
import { attachVisualAssetsToMaterial, saveVisualAsset } from "@/lib/storage/assets";
import { aiMaterialDocumentSchema, fromAiMaterialDocument } from "./ai-material-schema";
import { validateGeneratedMaterial } from "./validate-material";

const imageBriefSchema = z.object({
  placeholderKey: z.string().regex(/^brief:[a-zA-Z0-9_-]+$/),
  purpose: z.enum(["material-background", "material-scene"]),
  prompt: z.string().min(20).max(1200),
  alt: z.string().min(1).max(200),
  pageId: z.string().min(1),
}).strict();

const generationPlanSchema = z.object({
  document: aiMaterialDocumentSchema,
  imageBriefs: z.array(imageBriefSchema).max(3),
}).strict();

function requestedImageCount(amount: GenerationInput["imageAmount"]) {
  return amount === "many" ? 3 : amount === "standard" ? 2 : 1;
}

function generationPrompt(input: GenerationInput) {
  const imageCount = requestedImageCount(input.imageAmount);
  return JSON.stringify({
    task: "日本語の学習教材を生成する",
    requirements: {
      grade: input.grade,
      subject: input.subject,
      unit: input.unit,
      objective: `${input.unit}を理解し、自分で説明または回答できるようにする`,
      difficulty: input.difficulty,
      questionCount: input.questionCount,
      answerType: input.answerType,
      format: input.format,
      pageSize: input.pageSize,
      textAmount: input.textAmount,
      imageBriefCount: imageCount,
      additionalRequest: input.request,
      avoid: input.avoid,
      useCharacter: input.useCharacter,
    },
    imageRules: "imageBriefsは指定数ちょうど作る。背景はpage.backgroundAssetId、挿絵はillustrationブロックのassetIdへ同じbrief:...キーを設定する。画像内に文字やロゴを要求しない。",
  });
}

function replaceAssetReferences(document: MaterialDocument, assets: Map<string, string>) {
  return {
    ...document,
    pages: document.pages.map(page => ({
      ...page,
      backgroundAssetId: page.backgroundAssetId ? assets.get(page.backgroundAssetId) ?? page.backgroundAssetId : undefined,
      blocks: page.blocks.map(block => {
        if (block.type !== "illustration" && block.type !== "character") return block;
        return { ...block, assetId: assets.get(block.assetId) ?? block.assetId };
      }),
    })),
  };
}

export async function generateMaterial(input: GenerationInput, userId: string) {
  const textModel = getTextModel();
  const imageModel = getImageModel();
  const logId = await startGeneration({ userId, feature: "material", model: textModel, metadata: { subject: input.subject, grade: input.grade, imageModel } });
  let materialId: string | null = null;
  try {
    const plan = await generateStructuredText({
      schema: generationPlanSchema,
      schemaName: "gakugaku_material_plan",
      instructions: "あなたは日本の学習者向け教材設計者です。事実に忠実で、年齢相応、安全で、答えと解説が一貫した教材だけを出力してください。HTML、CSS、Markdownコードは出力しません。",
      prompt: generationPrompt(input),
    });
    if (plan.imageBriefs.length !== requestedImageCount(input.imageAmount)) throw new Error("画像設計数が指定と一致しません。");
    const initial = validateGeneratedMaterial(fromAiMaterialDocument(plan.document), input, { allowAssetPlaceholders: true });
    materialId = await createMaterialDraft(initial.metadata.title);
    const assets = new Map<string, string>();
    for (const brief of plan.imageBriefs) {
      const generated = await generateImage({ purpose: brief.purpose, prompt: brief.prompt, userId, landscape: brief.purpose === "material-background" });
      const assetId = crypto.randomUUID();
      const storagePath = `users/${userId}/materials/${materialId}/1/${assetId}.webp`;
      const savedId = await saveVisualAsset({ ownerId: userId, kind: brief.purpose, storagePath, buffer: generated.buffer, width: generated.width, height: generated.height, generationType: "ai", metadata: { alt: brief.alt, pageId: brief.pageId, model: generated.model } });
      assets.set(brief.placeholderKey, savedId);
    }
    const finalDocument = validateGeneratedMaterial(replaceAssetReferences(initial, assets), input);
    await saveMaterial(finalDocument, materialId);
    const saved = await getMaterial(materialId);
    if (!saved) throw new Error("保存した教材を確認できませんでした。");
    await attachVisualAssetsToMaterial([...assets.values()], materialId, saved.version.id);
    await finishGeneration(logId, true);
    return { id: materialId, imageCount: assets.size };
  } catch (error) {
    if (materialId) await deleteEmptyMaterialDraft(materialId);
    await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    throw error;
  }
}
