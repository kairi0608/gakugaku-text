import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { normalizeUploadedImage, saveVisualAsset } from "@/lib/storage/assets";

export async function POST(request: Request) {
  try {
    const current = await requireApiRole(["teacher"]);
    const form = await request.formData();
    const file = form.get("file");
    const description = String(form.get("description") ?? "").trim().slice(0, 500);
    if (!(file instanceof File)) return NextResponse.json({ error: "写真ファイルを選択してください。" }, { status: 400 });
    const image = await normalizeUploadedImage(file);
    const id = crypto.randomUUID();
    const storagePath = `users/${current.user.id}/materials/photos/${id}.webp`;
    const assetId = await saveVisualAsset({ ownerId: current.user.id, kind: "photo", storagePath, ...image, generationType: "upload", assetSource: "upload", assetKind: "photo", metadata: { description, disclosure: "Teacher uploaded photo" } });
    return NextResponse.json({ assetId, source: "upload", kind: "photo" }, { status: 201 });
  } catch (error) {
    return apiError(error, "写真を保存できませんでした。");
  }
}
