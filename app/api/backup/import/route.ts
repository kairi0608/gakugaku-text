import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ error: "Supabase版のインポートは管理者操作として今後実装します。" }, { status: 501 }); }
