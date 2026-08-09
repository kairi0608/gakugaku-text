import { NextResponse } from "next/server";
import { generationInputSchema } from "@/features/materials/shared/schemas";
import { sampleDocument, saveMaterial } from "@/lib/materials";
export async function POST(req: Request) { try { const input = generationInputSchema.parse(await req.json()); const id = await saveMaterial(sampleDocument(input)); return NextResponse.json({ id, imageStatus: process.env.OPENAI_API_KEY ? "queued" : "placeholder" }); } catch (error) { console.error("material generation failed", error); return NextResponse.json({ error: "入力内容を確認して、もう一度お試しください。" }, { status: 400 }); } }
