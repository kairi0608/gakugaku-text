import { NextResponse } from "next/server";
import { exportHubData } from "@/lib/materials";
export async function POST() { try { const backup = await exportHubData(); return new NextResponse(JSON.stringify(backup, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": "attachment; filename=gakugaku-backup.json" } }); } catch (error) { console.error(error); return NextResponse.json({ error: "バックアップに失敗しました。" }, { status: 500 }); } }
