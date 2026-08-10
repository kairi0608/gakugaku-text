import { NextResponse } from "next/server";
import { exportHubData } from "@/lib/materials";
import { requireApiUser } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
export async function POST() { try { await requireApiUser(); const backup = await exportHubData(); return new NextResponse(JSON.stringify(backup, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": "attachment; filename=gakugaku-backup.json", "cache-control": "no-store" } }); } catch (error) { return apiError(error, "バックアップに失敗しました。"); } }
