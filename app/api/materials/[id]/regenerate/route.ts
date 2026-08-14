import { NextResponse } from "next/server";
import { z } from "zod";
import { aiMaterialDocumentSchema, fromAiMaterialDocument } from "@/features/material-generation/server/ai-material-schema";
import { AiConfigurationError } from "@/lib/ai/errors";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError, apiServiceUnavailable } from "@/lib/http/api-error";
import { getMaterial, ownsMaterial, saveMaterial } from "@/lib/materials";

const schema = z.object({ request: z.string().trim().min(1).max(2000) }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let logId: string | null = null;
  try {
    const current = await requireApiRole(["personal", "student", "teacher"]);
    const input = schema.parse(await request.json());
    const { id } = await params;
    if (!await ownsMaterial(id, current.user.id)) return NextResponse.json({ error: "この教材を変更する権限がありません。" }, { status: 403 });
    const material = await getMaterial(id);
    if (!material) return NextResponse.json({ error: "教材が見つかりません。" }, { status: 404 });
    const model = getTextModel();
    logId = await startGeneration({ userId: current.user.id, feature: "material", model, metadata: { materialId: id, operation: "regenerate" } });
    const document = await generateStructuredText({
      schema: aiMaterialDocumentSchema,
      schemaName: "gakugaku_material_revision",
      instructions: "既存の日本語教材を、依頼内容に沿って改善してください。問題と正答・解説の整合性、学年、教科、単元、画像assetIdを維持し、HTMLやCSSは出力しません。",
      prompt: JSON.stringify({ request: input.request, currentDocument: material.document }),
    });
    const revisedDocument = fromAiMaterialDocument(document);
    if (revisedDocument.metadata.grade !== material.document.metadata.grade || revisedDocument.metadata.subject !== material.document.metadata.subject || revisedDocument.metadata.unit !== material.document.metadata.unit) throw new Error("教材の基本条件が変更されました。");
    await saveMaterial(revisedDocument, id);
    await finishGeneration(logId, true);
    return NextResponse.json({ id, versionNumber: material.version.versionNumber + 1 });
  } catch (error) {
    if (logId) await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    if (error instanceof AiConfigurationError) return apiServiceUnavailable(error, "教材を再生成できませんでした。管理者がAI設定を確認してください。");
    return apiError(error, "教材を再生成できませんでした。");
  }
}
