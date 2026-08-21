import { notFound } from "next/navigation";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("teacher");
  const { id } = await params;
  const db = await createClient();
  const { data: classroom } = await db.from("hub_classrooms").select("id,name,join_code").eq("id", id).maybeSingle();
  if (!classroom) notFound();
  const { data: members, error } = await db.from("hub_classroom_members").select("student_id,joined_at").eq("classroom_id", id).order("joined_at");
  if (error) throw new Error(`名簿を取得できませんでした: ${error.message}`);
  const studentIds = (members ?? []).map(member => member.student_id);
  const [profiles, sessions, moods, settings] = studentIds.length ? await Promise.all([
    db.from("profiles").select("id,display_name,grade_band").in("id", studentIds),
    db.from("hub_learning_sessions").select("user_id,subject,unit,active_seconds,completed_question_count,correct_question_count,score,started_at").in("user_id", studentIds).order("started_at", { ascending: false }),
    db.from("hub_daily_moods").select("user_id,mood,local_date").in("user_id", studentIds).order("local_date", { ascending: false }),
    db.from("hub_user_settings").select("user_id,presentation_family,interest_category").in("user_id", studentIds),
  ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  if (profiles.error || sessions.error || moods.error || settings.error) throw new Error("生徒の学習情報を取得できませんでした。006マイグレーションを確認してください。");
  const profileMap = new Map((profiles.data ?? []).map(profile => [profile.id, profile]));
  const sessionMap = new Map<string, typeof sessions.data>(); for (const session of sessions.data ?? []) sessionMap.set(session.user_id, [...(sessionMap.get(session.user_id) ?? []), session]);
  const moodMap = new Map<string, { mood: string; local_date: string }>(); for (const mood of moods.data ?? []) if (!moodMap.has(mood.user_id)) moodMap.set(mood.user_id, mood);
  const settingMap = new Map((settings.data ?? []).map(setting => [setting.user_id, setting]));
  return <main className="shell"><PageHeader eyebrow="クラス概要" title={classroom.name} description={`参加コード: ${classroom.join_code}`} /><AppCard><h2>生徒の学習状況</h2><p className="caption">気分は学習調整の参考情報であり、医療・心理状態の診断には使用しません。</p>{members?.length ? <div className="class-learning-list">{members.map(member => { const profile = profileMap.get(member.student_id); const studentSessions = sessionMap.get(member.student_id) ?? []; const completed = studentSessions.reduce((sum, item) => sum + Number(item.completed_question_count ?? 0), 0); const correct = studentSessions.reduce((sum, item) => sum + Number(item.correct_question_count ?? 0), 0); const activeSeconds = studentSessions.reduce((sum, item) => sum + Number(item.active_seconds ?? 0), 0); const latest = studentSessions[0]; const mood = moodMap.get(member.student_id); const preference = settingMap.get(member.student_id); return <article className="class-learning-row" key={member.student_id}><div><strong>{profile?.display_name ?? "生徒"}</strong><span>{profile?.grade_band ?? "学年未設定"}</span></div><dl><div><dt>学習時間</dt><dd>{Math.round(activeSeconds / 60)}分</dd></div><div><dt>回答</dt><dd>{completed}問</dd></div><div><dt>正答率</dt><dd>{completed ? `${Math.round(correct / completed * 100)}%` : "—"}</dd></div><div><dt>最近の学習</dt><dd>{latest ? `${latest.subject ?? "—"}${latest.unit ? ` / ${latest.unit}` : ""}` : "—"}</dd></div><div><dt>最近の気分</dt><dd>{mood ? `${moodLabel(mood.mood)} (${mood.local_date})` : "未回答"}</dd></div><div><dt>見せ方</dt><dd>{preference?.presentation_family === "real" ? "図鑑・リアル" : "イラスト"} / {interestLabel(preference?.interest_category)}</dd></div></dl></article>; })}</div> : <EmptyState title="参加している生徒はいません" description="参加コードを生徒に伝えてください。" />}</AppCard></main>;
}

function moodLabel(value: string) { return ({ "very-good": "とても元気", good: "元気", neutral: "いつも通り", tired: "少し疲れた", low: "ゆっくり" } as Record<string, string>)[value] ?? "未回答"; }
function interestLabel(value?: string) { return ({ animals: "動物", space: "宇宙", sports: "スポーツ", vehicles: "乗り物", nature: "自然", adventure: "冒険" } as Record<string, string>)[value ?? ""] ?? "冒険"; }
