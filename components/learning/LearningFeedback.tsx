import { CircleCheckBig, CircleHelp, TriangleAlert } from "lucide-react";
import type { AggregateFeedback, MaterialDocument, QuestionEvaluation } from "@/features/materials/shared/types";

type EvaluationWithQuestion = QuestionEvaluation & { questionId: string };

export function LearningFeedback({ document, evaluations, aggregate, feedbackStatus }: { document: MaterialDocument; evaluations: EvaluationWithQuestion[]; aggregate?: AggregateFeedback; feedbackStatus: "not-required" | "pending" | "complete" | "failed" }) {
  if (feedbackStatus === "failed") return <section className="notice warning feedback-status"><TriangleAlert aria-hidden="true" size={20} /><div><strong>AIフィードバックを取得できませんでした</strong><p>回答と自動採点は保存されています。履歴から再評価できます。</p></div></section>;
  if (feedbackStatus === "pending") return <section className="notice feedback-status"><CircleHelp aria-hidden="true" size={20} /><div><strong>AIが回答を確認しています</strong><p>回答は保存済みです。完了後に履歴へ反映されます。</p></div></section>;
  if (!evaluations.length && !aggregate) return null;
  return <div className="learning-feedback">
    {aggregate && <section className="aggregate-feedback"><div className="feedback-heading"><CircleCheckBig aria-hidden="true" size={22} /><h2>学習全体のフィードバック</h2></div><p>{aggregate.summary}</p><div className="feedback-columns"><div><h3>できていたこと</h3><ul>{aggregate.strengths.map(item => <li key={item}>{item}</li>)}</ul></div><div><h3>次に取り組むこと</h3><ul>{aggregate.improvements.map(item => <li key={item}>{item}</li>)}</ul></div></div><p><strong>おすすめ:</strong> {aggregate.recommendedNextSteps.join("・")}</p><p>{aggregate.encouragement}</p></section>}
    {evaluations.map(item => { const question = document.questions.find(candidate => candidate.id === item.questionId); return <section className="evaluation-card" key={item.questionId}><div className="feedback-heading"><StatusIcon verdict={item.verdict} /><strong>問題 {question?.order ?? ""}・{verdictLabel(item.verdict)}（{item.score}点）</strong></div><p>{item.goodPoint}</p><p>{item.improvement}</p>{document.feedbackPolicy.allowHints && item.hint && <p className="hint">ヒント: {item.hint}</p>}{document.feedbackPolicy.revealAnswer && item.modelAnswer && <p>回答例: {item.modelAnswer}</p>}</section>; })}
  </div>;
}

function verdictLabel(verdict: QuestionEvaluation["verdict"]) {
  return { correct: "正解", mostly_correct: "ほぼ正解", needs_review: "確認が必要", incorrect: "もう一度確認" }[verdict];
}

function StatusIcon({ verdict }: { verdict: QuestionEvaluation["verdict"] }) {
  return verdict === "correct" || verdict === "mostly_correct" ? <CircleCheckBig aria-hidden="true" size={20} /> : verdict === "needs_review" ? <CircleHelp aria-hidden="true" size={20} /> : <TriangleAlert aria-hidden="true" size={20} />;
}
