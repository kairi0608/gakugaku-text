import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireApiRole(["teacher"]);
    const db = await createClient();
    const classrooms = await db.from("hub_classrooms").select("id,name").order("name");
    if (classrooms.error) throw classrooms.error;
    const classroomIds = (classrooms.data ?? []).map(item => item.id);
    if (!classroomIds.length) return NextResponse.json({ students: [] });
    const members = await db.from("hub_classroom_members").select("classroom_id,student_id").in("classroom_id", classroomIds);
    if (members.error) throw members.error;
    const studentIds = [...new Set((members.data ?? []).map(item => item.student_id))];
    const profiles = studentIds.length ? await db.from("profiles").select("id,display_name").in("id", studentIds) : { data: [], error: null };
    if (profiles.error) throw profiles.error;
    const names = new Map((profiles.data ?? []).map(item => [item.id, item.display_name]));
    const classroomNames = new Map((classrooms.data ?? []).map(item => [item.id, item.name]));
    return NextResponse.json({ students: (members.data ?? []).map(item => ({ id: item.student_id, displayName: names.get(item.student_id) ?? "生徒", classroomName: classroomNames.get(item.classroom_id) ?? "クラス" })) });
  } catch (error) {
    return apiError(error, "対象生徒を取得できませんでした。");
  }
}
