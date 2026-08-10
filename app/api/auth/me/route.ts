import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";

export async function GET() {
  try {
    const current = await requireApiUser();
    return NextResponse.json({ role: current.profile.role, gradeBand: current.profile.gradeBand });
  } catch (error) {
    return apiError(error, "アカウント情報を取得できませんでした。");
  }
}
