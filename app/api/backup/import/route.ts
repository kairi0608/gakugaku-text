import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-role";
export async function POST() { await requireApiUser(); return NextResponse.json({ error: "安全性のため、ブラウザからの一括インポートには対応していません。エクスポートのみ利用できます。" }, { status: 405, headers: { Allow: "POST" } }); }
