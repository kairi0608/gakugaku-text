import { NextResponse } from "next/server";
import { z } from "zod";
import { createAttempt } from "@/lib/materials";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
const schema = z.object({ materialVersionId: z.string().uuid(), learnerName: z.string().min(1).max(80) }).strict();
export async function POST(req: Request) { try { await requireApiRole(["personal", "student", "teacher"]); const input = schema.parse(await req.json()); const id = await createAttempt(input.materialVersionId, input.learnerName); return NextResponse.json({ id }, { status: 201 }); } catch (error) { return apiError(error, "学習を開始できませんでした。"); } }
