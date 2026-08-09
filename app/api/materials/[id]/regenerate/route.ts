import { NextResponse } from "next/server";
import { getMaterial, saveMaterial } from "@/lib/materials";
import { z } from "zod";
const schema = z.object({ request: z.string().max(2000).default("") }).strict();
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) { try { schema.parse(await req.json()); const { id } = await params, material = await getMaterial(id); if (!material) throw new Error("教材が見つかりません"); await saveMaterial(material.document, id); return NextResponse.json({ id }); } catch (error) { console.error(error); return NextResponse.json({ error: "再生成できませんでした。" }, { status: 400 }); } }
