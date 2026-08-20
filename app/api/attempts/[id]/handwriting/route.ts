import { NextResponse } from "next/server";
import { materialDocumentSchema } from "@/features/materials/shared/schemas";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { normalizeHandwritingImage, saveHandwritingAsset } from "@/lib/storage/handwriting";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await requireApiRole(["personal", "student", "teacher"]);
    const { id } = await params;
    const form = await request.formData();
    const questionId = String(form.get("questionId") ?? "");
    const file = form.get("file");
    if (!questionId || !(file instanceof File)) return NextResponse.json({ error: "手書き回答が不足しています。" }, { status: 400 });
    const db = await createClient();
    const attempt = await db.from("hub_attempts").select("id,user_id,material_version_id,status").eq("id", id).maybeSingle();
    if (attempt.error) throw attempt.error;
    if (!attempt.data || attempt.data.user_id !== current.user.id) return NextResponse.json({ error: "この学習記録へ手書きを保存できません。" }, { status: 403 });
    if (attempt.data.status === "completed") return NextResponse.json({ error: "提出済みの回答は変更できません。" }, { status: 409 });
    const version = await db.from("hub_material_versions").select("document_json").eq("id", attempt.data.material_version_id).single();
    if (version.error) throw version.error;
    const document = materialDocumentSchema.parse(version.data.document_json);
    const question = document.questions.find(item => item.id === questionId);
    if (!question || question.answerType !== "drawing") return NextResponse.json({ error: "手書き問題が見つかりません。" }, { status: 400 });
    const normalized = await normalizeHandwritingImage(file);
    const assetId = await saveHandwritingAsset({ ownerId: current.user.id, attemptId: id, questionId, ...normalized });
    return NextResponse.json({ assetId }, { status: 201 });
  } catch (error) {
    return apiError(error, "手書き回答を保存できませんでした。");
  }
}
