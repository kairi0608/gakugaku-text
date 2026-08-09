import { NextResponse } from "next/server";
import { z } from "zod";
import { saveCompletedAttempt } from "@/lib/materials";
const schema = z.object({ materialId: z.string().uuid(), learnerName: z.string().min(1).max(80), answers: z.array(z.object({ questionId: z.string(), answer: z.string().max(5000) }).strict()) }).strict();
export async function POST(req: Request) { try { const input = schema.parse(await req.json()); return NextResponse.json(await saveCompletedAttempt(input.materialId, input.learnerName, input.answers)); } catch (error) { console.error(error); return NextResponse.json({ error: "採点結果を保存できませんでした。" }, { status: 400 }); } }
