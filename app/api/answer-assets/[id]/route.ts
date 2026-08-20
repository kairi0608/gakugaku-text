import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { getSignedHandwritingUrl } from "@/lib/storage/handwriting";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser();
    const { id } = await params;
    const url = await getSignedHandwritingUrl(id);
    if (!url) return NextResponse.json({ error: "手書き回答が見つかりません。" }, { status: 404 });
    return NextResponse.redirect(url, { headers: { "cache-control": "private, max-age=180" } });
  } catch (error) {
    return apiError(error, "手書き回答を表示できませんでした。");
  }
}
