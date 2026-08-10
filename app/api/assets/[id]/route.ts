import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { getSignedAssetUrl } from "@/lib/storage/assets";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser();
    const { id } = await params;
    const signedUrl = await getSignedAssetUrl(id);
    if (!signedUrl) return NextResponse.json({ error: "画像が見つかりません。" }, { status: 404 });
    return NextResponse.redirect(signedUrl, { headers: { "cache-control": "private, max-age=300" } });
  } catch (error) {
    return apiError(error, "画像を表示できませんでした。");
  }
}
