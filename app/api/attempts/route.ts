import { NextResponse } from "next/server";
import { z } from "zod";
import { createAttempt } from "@/lib/materials";
const schema = z.object({ materialVersionId: z.string().uuid(), learnerName: z.string().min(1).max(80) }).strict();
export async function POST(req: Request) { try { const input = schema.parse(await req.json()); const id = await createAttempt(input.materialVersionId, input.learnerName); return NextResponse.json({ id }); } catch (error) { console.error(error); return NextResponse.json({ error: "学習を開始できませんでした。" }, { status: 400 }); } }
