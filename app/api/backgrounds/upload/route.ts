import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { normalizeUploadedImage, saveVisualAsset, UploadValidationError } from "@/lib/storage/assets";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const current = await requireApiRole(["personal", "student", "teacher"]);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "画像ファイルを選択してください。" }, { status: 400 });
    const image = await normalizeUploadedImage(file);
    const assetKey = crypto.randomUUID();
    const storagePath = `users/${current.user.id}/backgrounds/${assetKey}.webp`;
    const assetId = await saveVisualAsset({ ownerId: current.user.id, kind: "app-background", storagePath, buffer: image.buffer, width: image.width, height: image.height, generationType: "upload", metadata: { originalName: file.name.slice(0, 180) } });
    return NextResponse.json({ assetId, previewUrl: `/api/assets/${assetId}` }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadValidationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return apiError(error, "背景画像をアップロードできませんでした。");
  }
}
