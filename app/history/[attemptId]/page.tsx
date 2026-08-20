import { Bot, CheckCircle2, CircleHelp, Clock3, ImageIcon, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { aggregateFeedbackSchema, answerPayloadSchema, evaluationSchema } from "@/features/materials/shared/schemas";
import type { AnswerPayload } from "@/features/materials/shared/types";
import { requireAnyRole } from "@/lib/auth/require-role";
import { getAttemptDetail } from "@/lib/materials";
import { RetryEvaluationButton } from "./RetryEvaluationButton";

export const dynamic = "force-dynamic";

export default async function HistoryDetailPage({ params }: { params: Promise<{ attemptId: string }> }) {
  await requireAnyRole(["personal", "student", "teacher"]);
  const { attemptId } = await params;
  const detail = await getAttemptDetail(attemptId);
  if (!detail) notFound();
  const { attempt, material, version, answers, feedback, answerAssets, submission } = detail;
  const answerMap = new Map(answers.map(item => [String(item.question_id), item]));
  const assetMap = new Map(answerAssets.map(item => [String(item.question_id), item]));
  const feedbackByQuestion = new Map<string, typeof feedback>();
  for (const item of feedback.filter(candidate => candidate.question_id)) {
    const questionId = String(item.question_id);
    feedbackByQuestion.set(questionId, [...(feedbackByQuestion.get(questionId) ?? []), item]);
  }
  const aggregateRow = feedback.find(item => item.source === "ai" && item.question_id == null);
  const aggregate = aggregateFeedbackSchema.safeParse(aggregateRow?.feedback_json);

  return <main className="shell history-detail">
    <PageHeader
      eyebrow="学習履歴の詳細"
      title={material.title}
      description={`${version.documentJson.metadata.subject} / ${version.documentJson.metadata.unit}`}
      action={<Link className="button outline" href={`/history/${attemptId}/material`}><ImageIcon aria-hidden="true" size={17} />このときの教材を見る</Link>}
    />
    <section className="history-summary-grid" aria-label="学習結果の概要">
      <AppCard><span className="caption"><Clock3 aria-hidden="true" size={14} /> 学習日時</span><strong>{new Date(attempt.completedAt ?? attempt.startedAt).toLocaleString("ja-JP")}</strong></AppCard>
      <AppCard><span className="caption">得点</span><strong className="history-big-value">{attempt.score ?? "—"}点</strong></AppCard>
      <AppCard><span className="caption">獲得EXP</span><strong className="history-big-value">+{attempt.expAwarded}</strong></AppCard>
      <AppCard><span className="caption">教材Version</span><strong>Version {version.versionNumber}</strong></AppCard>
    </section>

    {aggregate.success && <AppCard className="aggregate-feedback section-gap"><div className="feedback-heading"><Bot aria-hidden="true" size={22} /><h2>学習全体のAIフィードバック</h2></div><p>{aggregate.data.summary}</p><div className="feedback-columns"><div><h3>できていたこと</h3><ul>{aggregate.data.strengths.map(item => <li key={item}>{item}</li>)}</ul></div><div><h3>次に取り組むこと</h3><ul>{aggregate.data.improvements.map(item => <li key={item}>{item}</li>)}</ul></div></div><p><strong>次のおすすめ:</strong> {aggregate.data.recommendedNextSteps.join("・")}</p><p>{aggregate.data.encouragement}</p></AppCard>}
    {attempt.feedbackStatus === "failed" && <AppCard className="section-gap"><p className="notice warning"><CircleHelp aria-hidden="true" size={20} />AIフィードバックを取得できませんでした。回答と自動採点は保存されています。</p><RetryEvaluationButton attemptId={attemptId} /></AppCard>}

    <section className="history-question-list section-gap" aria-label="問題ごとの記録">
      <h2>問題ごとの記録</h2>
      {version.documentJson.questions.map(question => {
        const answer = answerMap.get(question.id);
        const payload = parseAnswer(answer?.answer_json);
        const asset = assetMap.get(question.id);
        const rows = feedbackByQuestion.get(question.id) ?? [];
        const aiRow = rows.find(item => item.source === "ai");
        const systemRow = rows.find(item => item.source === "system");
        const aiEvaluation = evaluationSchema.safeParse(aiRow?.feedback_json);
        return <AppCard className="history-question-card" key={question.id}>
          <header><div><span className="question-number">問題 {question.order}</span>{question.title && <h3>{question.title}</h3>}</div>{answer?.is_correct === true ? <StatusBadge tone="success"><CheckCircle2 aria-hidden="true" size={14} />正解</StatusBadge> : answer?.is_correct === false ? <StatusBadge tone="danger"><XCircle aria-hidden="true" size={14} />不正解</StatusBadge> : <StatusBadge tone="warning"><CircleHelp aria-hidden="true" size={14} />AI評価</StatusBadge>}</header>
          <p className="history-question-prompt">{question.prompt}</p>
          <div className="answer-review-grid">
            <section>
              <h4>あなたの回答</h4>
              {payload?.type === "drawing" && asset ? <>
                {/* eslint-disable-next-line @next/next/no-img-element -- authenticated short-lived Storage URL */}
                <img className="history-handwriting" src={`/api/answer-assets/${asset.id}`} alt={`問題${question.order}の手書き回答`} />
                {asset.recognized_text && <p><strong>読み取り結果:</strong> {asset.recognized_text}</p>}
                {asset.recognition_confidence != null && <p className="caption">認識確信度: {Math.round(Number(asset.recognition_confidence) * 100)}%</p>}
              </> : <p>{formatAnswer(payload, answer?.answer_text, question.choices)}</p>}
            </section>
            {version.documentJson.feedbackPolicy.revealAnswer && <section><h4>正答</h4><p>{question.correctAnswer}</p></section>}
          </div>
          {aiEvaluation.success && <section className="evaluation-card"><p><strong>AI評価 {aiEvaluation.data.score}点:</strong> {aiEvaluation.data.goodPoint}</p><p>{aiEvaluation.data.improvement}</p>{version.documentJson.feedbackPolicy.allowHints && aiEvaluation.data.hint && <p className="hint">ヒント: {aiEvaluation.data.hint}</p>}{version.documentJson.feedbackPolicy.revealAnswer && aiEvaluation.data.modelAnswer && <p>回答例: {aiEvaluation.data.modelAnswer}</p>}</section>}
          {!aiEvaluation.success && systemRow && <p className="notice">{systemRow.feedback_text}</p>}
          {version.documentJson.feedbackPolicy.revealAnswer && <details><summary>解説を見る</summary><p>{question.explanation}</p></details>}
        </AppCard>;
      })}
    </section>
    {submission?.teacher_feedback && <AppCard className="section-gap teacher-feedback"><h2>教師からのコメント</h2><p>{submission.teacher_feedback}</p>{submission.teacher_score != null && <p><strong>教師評価: {submission.teacher_score}点</strong></p>}</AppCard>}
    <div className="actions section-gap"><Link className="button outline" href="/history">履歴一覧へ戻る</Link></div>
  </main>;
}

function parseAnswer(value: unknown): AnswerPayload | null {
  const parsed = answerPayloadSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function formatAnswer(answer: AnswerPayload | null, fallback: unknown, choices?: Array<{ id: string; label: string }>) {
  const labels = new Map((choices ?? []).map(item => [item.id, item.label]));
  if (!answer) return String(fallback ?? "回答なし");
  if (answer.type === "multiple-choice") return answer.values.map(value => labels.get(value) ?? value).join("、");
  if (answer.type === "choice") return labels.get(answer.value) ?? answer.value;
  if (answer.type === "drawing") return "手書き回答";
  return answer.value;
}
