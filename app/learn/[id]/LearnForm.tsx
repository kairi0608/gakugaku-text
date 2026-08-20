"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppCard } from "@/components/design-system/AppCard";
import { InteractiveMaterialRenderer } from "@/components/learning/InteractiveMaterialRenderer";
import { LearningFeedback } from "@/components/learning/LearningFeedback";
import { LearningProgress } from "@/components/learning/LearningProgress";
import type { ExperienceRole } from "@/config/navigation";
import type { AggregateFeedback, AnswerPayload, MaterialDocument, QuestionEvaluation } from "@/features/materials/shared/types";
import { requiresAiEvaluation } from "@/lib/learning/answers";

type FeedbackStatus = "not-required" | "pending" | "complete" | "failed";
type Evaluation = QuestionEvaluation & { questionId: string };
type Result = {
  id: string;
  score: number;
  autoCorrectCount: number;
  feedback: string;
  expAwarded: number;
  submitted?: boolean;
  feedbackStatus: FeedbackStatus;
  evaluations: Evaluation[];
  aggregate?: AggregateFeedback;
};
type Phase = "idle" | "starting" | "uploading" | "saving" | "grading" | "feedback";

export function LearnForm({ materialId, materialVersionId, assignmentId, document: materialDocument, role, learnerName }: {
  materialId: string;
  materialVersionId: string;
  assignmentId?: string;
  document: MaterialDocument;
  role: ExperienceRole;
  learnerName: string;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  const [drawings, setDrawings] = useState<Record<string, Blob | null>>({});
  const [attemptId, setAttemptId] = useState<string>();
  const [done, setDone] = useState<Result | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const question = materialDocument.questions[current];
  const busy = phase !== "idle";

  function answerQuestion(value: AnswerPayload) {
    setAnswers(previous => ({ ...previous, [question.id]: value }));
  }

  function drawingChanged(blob: Blob | null) {
    setDrawings(previous => ({ ...previous, [question.id]: blob }));
  }

  function validateAnswers() {
    for (const item of materialDocument.questions) {
      if (item.answerType === "drawing") {
        if (!drawings[item.id]) throw new Error(`問題${item.order}に手書きで回答してください。`);
        continue;
      }
      const answer = answers[item.id];
      const empty = !answer
        || ("value" in answer && !answer.value.trim())
        || (answer.type === "multiple-choice" && answer.values.length === 0);
      if (empty) throw new Error(`問題${item.order}に回答してください。`);
    }
  }

  async function requestJson(url: string, init: RequestInit) {
    const response = await fetch(url, init);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "処理を完了できませんでした。");
    return body;
  }

  async function submit() {
    setError("");
    try {
      validateAnswers();
      setPhase("starting");
      let activeAttemptId = attemptId;
      if (!activeAttemptId) {
        const created = await requestJson("/api/attempts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ materialVersionId, learnerName }),
        });
        activeAttemptId = String(created.id);
        setAttemptId(activeAttemptId);
      }

      setPhase("uploading");
      const uploaded = new Map<string, string>();
      for (const item of materialDocument.questions.filter(candidate => candidate.answerType === "drawing")) {
        const data = new FormData();
        data.set("questionId", item.id);
        data.set("file", drawings[item.id]!, `handwriting-${item.id}.webp`);
        const result = await requestJson(`/api/attempts/${activeAttemptId}/handwriting`, { method: "POST", body: data });
        uploaded.set(item.id, String(result.assetId));
      }

      const submissions = materialDocument.questions.map(item => ({
        questionId: item.id,
        answer: item.answerType === "drawing" ? { type: "drawing" as const, assetId: uploaded.get(item.id)! } : answers[item.id],
      }));
      setPhase("saving");
      const submissionResponse = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: activeAttemptId, materialId, materialVersionId, assignmentId, learnerName, answers: submissions }),
      });
      const saved = await submissionResponse.json().catch(() => ({}));
      if (!submissionResponse.ok) throw new Error(typeof saved.error === "string" ? saved.error : "回答を保存できませんでした。");

      let result: Result = { ...saved, feedbackStatus: saved.feedbackStatus, evaluations: [] };
      if (saved.feedbackStatus === "pending" && materialDocument.questions.some(requiresAiEvaluation)) {
        setPhase("feedback");
        try {
          const evaluated = await requestJson(`/api/attempts/${activeAttemptId}/evaluate`, { method: "POST" });
          result = {
            ...result,
            score: evaluated.overallScore ?? result.score,
            expAwarded: result.expAwarded + Number(evaluated.expAwarded ?? 0),
            feedbackStatus: evaluated.feedbackStatus,
            evaluations: evaluated.evaluations ?? [],
            aggregate: evaluated.aggregate ?? undefined,
          };
        } catch (reason) {
          result.feedbackStatus = "failed";
          setError(reason instanceof Error ? reason.message : "AIフィードバックを取得できませんでした。");
        }
      } else {
        setPhase("grading");
      }
      setDone(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "採点できませんでした。");
    } finally {
      setPhase("idle");
    }
  }

  function retry() {
    setCurrent(0);
    setAnswers({});
    setDrawings({});
    setAttemptId(undefined);
    setDone(null);
    setError("");
  }

  if (done) return <section className="learn-result-layout">
    <AppCard className="learn-result">
      <CheckCircle2 aria-hidden="true" size={36} color="var(--success)" />
      <p className="eyebrow">{done.submitted ? "課題を提出しました" : "学習完了"}</p>
      <div className="score">{done.score}点</div>
      <p>{done.feedback}</p>
      <p className="exp-earned">+{done.expAwarded} EXP</p>
    </AppCard>
    <LearningFeedback document={materialDocument} evaluations={done.evaluations} aggregate={done.aggregate} feedbackStatus={done.feedbackStatus} />
    {error && <p className="notice warning" role="status">{error}</p>}
    <div className="actions mobile-stack">
      <Link className="button" href={`/${role}`}>ホームへ</Link>
      <Link className="button secondary" href={`/history/${done.id}`}>今回の学習結果を見る</Link>
      <button className="button outline" type="button" onClick={retry}><RotateCcw aria-hidden="true" size={17} />もう一度学ぶ</button>
    </div>
  </section>;

  const phaseLabel: Record<Exclude<Phase, "idle">, string> = {
    starting: "学習記録を準備しています",
    uploading: "手書き回答を保存しています",
    saving: "回答を保存しています",
    grading: "採点しています",
    feedback: "AIが回答を確認し、学習結果をまとめています",
  };

  return <section aria-label="問題への回答" className="interactive-learning">
    <LearningProgress current={current + 1} total={materialDocument.questions.length} phase={busy ? phaseLabel[phase as Exclude<Phase, "idle">] : undefined} />
    <InteractiveMaterialRenderer
      key={question.id}
      document={materialDocument}
      question={question}
      answer={answers[question.id]}
      drawingBlob={drawings[question.id]}
      disabled={busy}
      onAnswerChange={answerQuestion}
      onDrawingChange={drawingChanged}
    />
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="learn-actions">
      <button className="button outline" type="button" disabled={busy || current === 0} onClick={() => setCurrent(value => value - 1)}><ArrowLeft aria-hidden="true" size={17} />前の問題</button>
      {current < materialDocument.questions.length - 1
        ? <button className="button" type="button" disabled={busy} onClick={() => setCurrent(value => value + 1)}>次の問題<ArrowRight aria-hidden="true" size={17} /></button>
        : <button className="button" type="button" disabled={busy} onClick={submit}>{busy ? phaseLabel[phase as Exclude<Phase, "idle">] : assignmentId ? "回答を提出して採点" : "回答を保存して採点"}</button>}
    </div>
  </section>;
}
