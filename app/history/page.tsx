import { Bot, Clock3 } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { withExperienceRole } from "@/config/navigation";
import { getAttemptHistory } from "@/lib/materials";
import { requireAnyRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { profile: { role } } = await requireAnyRole(["personal", "student", "teacher"]);
  let loadError = false;
  const rows = await getAttemptHistory().catch(() => { loadError = true; return []; });
  return (
    <main className="shell">
      <PageHeader eyebrow="学習の記録" title="学習履歴" description="提出した回答、採点、フィードバックを新しい順に確認できます。" />
      {loadError && <p className="notice error">学習履歴を読み込めませんでした。設定画面でSupabaseの接続情報を確認してください。</p>}
      {rows.length ? <div className="history-list">{rows.map(row => <article className="history-row" key={row.id}><div><h2>{row.materialTitle ?? "教材"}</h2><p><Clock3 aria-hidden="true" size={13} /> {new Date(row.completedAt ?? row.startedAt).toLocaleString("ja-JP")}・{row.subject ?? "教科未設定"}{row.unit ? ` / ${row.unit}` : ""}・Version {row.versionNumber ?? "—"}</p><div className="history-statuses"><StatusBadge tone={row.status === "completed" ? "success" : "warning"}>{row.status === "completed" ? "完了" : "学習中"}</StatusBadge>{row.hasAiFeedback && <StatusBadge><Bot aria-hidden="true" size={13} /> AIフィードバックあり</StatusBadge>}{row.feedbackStatus === "failed" && <StatusBadge tone="warning">AI確認失敗</StatusBadge>}</div></div><strong className="score-badge">{row.score === null ? "—" : `${row.score}点`}</strong><Link className="button outline" href={`/history/${row.id}`}>詳細を見る</Link></article>)}</div> : !loadError && <EmptyState title="学習履歴はまだありません" description="教材を選んで回答を提出すると、日時と得点がここに残ります。" action={<Link className="button" href={withExperienceRole("/materials", role)}>学習を始める</Link>} />}
    </main>
  );
}
