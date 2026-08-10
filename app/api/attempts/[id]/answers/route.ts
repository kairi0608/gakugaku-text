import { NextResponse } from "next/server";
import { z } from "zod";
import { saveAnswer } from "@/lib/materials";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
const schema = z.object({ questionId: z.string(), answerText: z.string().max(5000) }).strict();
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireApiRole(["personal", "student", "teacher"]); const input = schema.parse(await req.json()), { id } = await params; await saveAnswer(id, input.questionId, input.answerText); return NextResponse.json({ saved: true }); } catch (error) { return apiError(error, "回答を保存できませんでした。"); } }
