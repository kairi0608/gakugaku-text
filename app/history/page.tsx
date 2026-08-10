import { Clock3 } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { parseExperienceRole, withExperienceRole } from "@/config/navigation";
import { getAttemptHistory } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ from?: string | string[] }> }) {
  const role = parseExperienceRole((await searchParams).from) ?? "personal";
  let loadError = false;
  const rows = await getAttemptHistory().catch(() => { loadError = true; return []; });
  return (
    <main className="shell">
      <PageHeader eyebrow="学習の記録" title="学習履歴" description="教材ごとの得点と学習日時を、新しい順に確認できます。" />
      {loadError && <p className="notice error">学習履歴を読み込めませんでした。設定画面でSupabaseの接続情報を確認してください。</p>}
      {rows.length ? <div className="history-list">{rows.map(row => <article className="history-row" key={row.id}><div><h2>{row.materialTitle ?? "教材"}</h2><p><Clock3 aria-hidden="true" size={13} /> {new Date(row.startedAt).toLocaleString("ja-JP")}・{row.learnerName}・バージョン {row.versionNumber ?? "—"}</p><StatusBadge tone={row.status === "completed" ? "success" : "warning"}>{row.status === "completed" ? "完了" : "学習中"}</StatusBadge></div><strong className="score-badge">{row.score === null ? "—" : `${row.score}点`}</strong>{row.materialId ? <Link className="button outline" href={withExperienceRole(`/materials/${row.materialId}`, role)}>教材を見る</Link> : <span />}</article>)}</div> : !loadError && <EmptyState title="学習履歴はまだありません" description="教材を選んで回答を提出すると、日時と得点がここに残ります。" action={<Link className="button" href={withExperienceRole("/materials", role)}>学習を始める</Link>} />}
    </main>
  );
}
