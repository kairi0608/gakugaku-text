import { NextResponse } from "next/server";
import { specialEventCreateSchema, whatIfQuestionSchema } from "@/features/learning-session/shared/schemas";
import { finishGeneration, startGeneration } from "@/lib/ai/generation-log";
import { generateStructuredText, getTextModel } from "@/lib/ai/text-provider";
import { requireApiRole } from "@/lib/auth/require-role";
import { apiError } from "@/lib/http/api-error";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let logId: string | null = null;
  try {
    const current = await requireApiRole(["teacher"]);
    const input = specialEventCreateSchema.parse(await request.json());
    const db = await createClient();
    const classroom = await db.from("hub_classrooms").select("id,teacher_id,name").eq("id", input.classroomId).maybeSingle();
    if (classroom.error) throw classroom.error;
    if (!classroom.data || (current.profile.role !== "admin" && classroom.data.teacher_id !== current.user.id)) return NextResponse.json({ error: "担当クラスが見つかりません。" }, { status: 404 });
    let whatIf;
    if (input.source === "ai") {
      const model = getTextModel();
      logId = await startGeneration({ userId: current.user.id, feature: "what-if", model, metadata: { classroomId: input.classroomId, source: "teacher-event" } });
      whatIf = await generateStructuredText({
        schema: whatIfQuestionSchema,
        schemaName: "gakugaku_what_if_event",
        instructions: "小中高生が自由に仮説を考えられる安全なWhat If問題を日本語で1問作ります。正解を一つに固定せず、教科との接続を明示し、個人情報・診断・恐怖を煽る内容を避けます。visualBriefはイラスト案で、実写真とは表現しません。",
        prompt: JSON.stringify({ title: input.title, className: classroom.data.name, teacherRequest: input.question ?? "", presentationFamily: input.presentationFamily }),
      });
      await finishGeneration(logId, true); logId = null;
    } else {
      whatIf = whatIfQuestionSchema.parse({ title: input.title, question: input.question, visualBrief: "教師が設定した問いを中心にした学習カード", thinkingHints: [], learningConnections: [] });
    }
    const id = crypto.randomUUID();
    const created = await db.from("hub_special_events").insert({ id, classroom_id: input.classroomId, teacher_id: current.user.id, title: input.title, start_at: input.startAt, end_at: input.endAt ?? null, trigger_type: input.triggerType, trigger_config: input.triggerType === "login-streak" ? { streakDays: input.streakDays } : {}, source: input.source, what_if_json: whatIf, presentation_family: input.presentationFamily, enabled: input.enabled }).select("id").single();
    if (created.error) throw created.error;
    return NextResponse.json({ id: created.data.id, whatIf }, { status: 201 });
  } catch (error) {
    if (logId) await finishGeneration(logId, false, error instanceof Error ? error.name : "unknown_error");
    return apiError(error, "特別イベントを作成できませんでした。失敗したイベントは保存していません。");
  }
}
