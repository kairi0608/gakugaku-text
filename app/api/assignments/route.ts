import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ classroomId: z.string().uuid(), materialVersionId: z.string().uuid(), title: z.string().trim().min(1).max(160), instructions: z.string().max(4000).default(""), dueAt: z.string().datetime().nullable().optional(), publish: z.boolean().default(false) }).strict();

export async function POST(request: Request) {
  try {
    const current = await requireApiRole(["teacher"]);
    const input = schema.parse(await request.json());
    const db = await createClient();
    const { data: classroom } = await db.from("hub_classrooms").select("id").eq("id", input.classroomId).maybeSingle();
    if (!classroom) return NextResponse.json({ error: "クラスが見つかりません。" }, { status: 404 });
    const { data: version } = await db.from("hub_material_versions").select("id,material_id").eq("id", input.materialVersionId).maybeSingle();
    if (!version) return NextResponse.json({ error: "教材バージョンが見つかりません。" }, { status: 404 });
    const { data: material } = await db.from("hub_materials").select("id,owner_id,current_version_id,status").eq("id", version.material_id).maybeSingle();
    if (!material || material.current_version_id !== input.materialVersionId || !["approved", "published"].includes(material.status) || (current.profile.role !== "admin" && material.owner_id !== current.user.id)) {
      return NextResponse.json({ error: "教師が確認・承認した最新教材だけを課題に使用できます。" }, { status: 409 });
    }
    const id = crypto.randomUUID();
    const { data, error } = await db.from("hub_assignments").insert({ id, classroom_id: input.classroomId, teacher_id: current.user.id, material_version_id: input.materialVersionId, title: input.title, instructions: input.instructions, due_at: input.dueAt ?? null, published_at: input.publish ? new Date().toISOString() : null }).select("*").single();
    if (error) throw error;
    if (input.publish && material.status === "approved") {
      const published = await db.from("hub_materials").update({ status: "published", updated_at: new Date().toISOString() }).eq("id", material.id).eq("status", "approved");
      if (published.error) throw published.error;
    }
    return NextResponse.json({ assignment: data }, { status: 201 });
  } catch (error) {
    return apiError(error, "課題を作成できませんでした。");
  }
}
