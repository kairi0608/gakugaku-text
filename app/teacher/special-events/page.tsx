import { Lightbulb } from "lucide-react";
import { AppCard } from "@/components/design-system/AppCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { EventToggle, SpecialEventForm } from "./SpecialEventForm";

export const dynamic = "force-dynamic";
export default async function SpecialEventsPage() {
  await requireRole("teacher"); const db = await createClient();
  const [classrooms, events] = await Promise.all([db.from("hub_classrooms").select("id,name").order("name"), db.from("hub_special_events").select("id,title,start_at,end_at,trigger_type,source,enabled,what_if_json").order("created_at", { ascending: false })]);
  if (classrooms.error || events.error) throw new Error("特別イベントを読み込めませんでした。006マイグレーションを確認してください。");
  return <main className="shell"><PageHeader eyebrow="教師ページ" title="What If 特別イベント" description="指定期間や連続ログインをきっかけに、教科横断の自由な問いを届けます。" /><AppCard><h2><Lightbulb aria-hidden="true" size={20} /> 新しいイベント</h2><SpecialEventForm classrooms={classrooms.data ?? []} /></AppCard><section className="section-gap"><h2>イベント一覧</h2>{events.data?.length ? <div className="special-event-list">{events.data.map(event => { const value = event.what_if_json as { question?: string }; return <AppCard key={event.id}><div className="event-card-header"><div><h3>{event.title}</h3><p>{new Date(event.start_at).toLocaleString("ja-JP")} から{event.end_at ? ` ${new Date(event.end_at).toLocaleString("ja-JP")} まで` : "終了日なし"}</p></div><StatusBadge tone={event.enabled ? "success" : "default"}>{event.enabled ? "有効" : "停止中"}</StatusBadge></div><p>{value.question ?? "問いを表示できません"}</p><p className="caption">{event.source === "ai" ? "AI生成" : "教師作成"}・{event.trigger_type === "login-streak" ? "連続ログイン" : "指定期間"}</p><EventToggle id={event.id} enabled={event.enabled} /></AppCard>; })}</div> : <EmptyState title="特別イベントはまだありません" description="クラス、期間、問いを設定して最初のイベントを作成してください。" />}</section></main>;
}
