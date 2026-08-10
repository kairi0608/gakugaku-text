import { NextResponse } from "next/server";
import { generationInputSchema } from "@/features/materials/shared/schemas";
import { generateMaterial } from "@/features/material-generation/server/generate-material";
import { requireApiRole } from "@/lib/auth/require-role";
import { AiConfigurationError } from "@/lib/ai/errors";
import { apiError } from "@/lib/http/api-error";

export async function POST(request: Request) {
  try {
    const current = await requireApiRole(["personal", "student", "teacher"]);
    const input = generationInputSchema.parse(await request.json());
    return NextResponse.json(await generateMaterial(input, current.user.id), { status: 201 });
  } catch (error) {
    if (error instanceof AiConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    return apiError(error, "AI教材を生成できませんでした。時間をおいて再度お試しください。");
  }
}
