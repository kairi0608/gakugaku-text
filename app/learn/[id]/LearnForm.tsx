"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { AppCard } from "@/components/design-system/AppCard";
import type { ExperienceRole } from "@/config/navigation";
import type { MaterialDocument } from "@/features/materials/shared/types";

type Evaluation = { questionId: string; verdict: "correct" | "partial" | "incorrect"; score: number; goodPoint: string; improvement: string; hint: string; modelAnswer?: string; overallScore: number; expAwarded: number };
type Result = { id: string; score: number; autoCorrectCount: number; feedback: string; expAwarded: number; submitted?: boolean; evaluations: Evaluation[] };

export function LearnForm({ materialId, materialVersionId, assignmentId, document: materialDocument, role, learnerName }: { materialId: string; materialVersionId?: string; assignmentId?: string; document: MaterialDocument; role: ExperienceRole; learnerName: string }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const question = materialDocument.questions[current];
  const progress = Math.round((current + 1) / materialDocument.questions.length * 100);

  function setAnswer(value: string) { setAnswers(previous => ({ ...previous, [question.id]: value })); }
  function toggleMultiple(value: string, checked: boolean) {
    const selected = (answers[question.id] ?? "").split(",").filter(Boolean);
    setAnswer((checked ? [...new Set([...selected, value])] : selected.filter(item => item !== value)).join(","));
  }

  async function submit() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/attempts/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ materialId, materialVersionId, assignmentId, learnerName, answers: materialDocument.questions.map(item => ({ questionId: item.id, answer: answers[item.id] ?? "" })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "採点できませんでした。");
      const descriptive = materialDocument.questions.filter(item => item.answerType === "text" || item.answerType === "drawing");
      const evaluations: Evaluation[] = [];
      for (const item of descriptive) {
        const evaluationResponse = await fetch(`/api/attempts/${result.id}/evaluate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: item.id, studentAnswer: answers[item.id] ?? "" }) });
        const evaluation = await evaluationResponse.json();
        if (!evaluationResponse.ok) throw new Error(evaluation.error ?? "AIフィードバックを取得できませんでした。");
        evaluations.push({ questionId: item.id, ...evaluation } as Evaluation);
      }
      const finalScore = evaluations.at(-1)?.overallScore ?? result.score;
      const extraExp = evaluations.reduce((sum, item) => sum + item.expAwarded, 0);
      setDone({ ...result, score: finalScore, expAwarded: result.expAwarded + extraExp, evaluations });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "採点できませんでした。");
    } finally { setBusy(false); }
  }

  function retry() { setCurrent(0); setAnswers({}); setDone(null); setError(""); }
  if (done) return <AppCard className="learn-result"><CheckCircle2 aria-hidden="true" size={36} color="var(--success)" /><p className="eyebrow">{done.submitted ? "課題を提出しました" : "学習完了"}</p><div className="score">{done.score}点</div><p>{done.feedback}</p><p className="exp-earned">+{done.expAwarded} EXP</p>{done.evaluations.map(item => <section className="evaluation-card" key={item.questionId}><strong>{item.goodPoint}</strong><p>{item.improvement}</p><p className="hint">ヒント: {item.hint}</p>{item.modelAnswer && <p>回答例: {item.modelAnswer}</p>}</section>)}<div className="actions"><a className="button" href={`/${role}`}>ホームへ</a>{role !== "teacher" && <a className="button secondary" href="/history">学習履歴を見る</a>}<button className="button outline" type="button" onClick={retry}><RotateCcw aria-hidden="true" size={17} />もう一度学ぶ</button></div></AppCard>;

  return <section aria-label="問題への回答"><div className="learn-progress"><span>問題 {current + 1} / {materialDocument.questions.length}</span><div className="progress-track" aria-label={`学習進捗 ${progress}%`}><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div><AppCard className="learn-card"><span className="question-number">問題 {question.order}</span>{question.title && <p className="caption">{question.title}</p>}<h2>{question.prompt}</h2>{question.instructions && <p className="muted">{question.instructions}</p>}{(question.answerType === "choice" || question.answerType === "multiple-choice") ? <div className="choices">{question.choices?.map(choice => { const selected = (answers[question.id] ?? "").split(",").includes(choice.id); return <label className="choice" key={choice.id}><input type={question.answerType === "choice" ? "radio" : "checkbox"} name={question.id} value={choice.id} checked={selected} onChange={event => question.answerType === "choice" ? setAnswer(choice.id) : toggleMultiple(choice.id, event.target.checked)} /><span>{choice.label}</span></label>; })}</div> : <label className="field"><span className="field-label">回答</span><textarea value={answers[question.id] ?? ""} onChange={event => setAnswer(event.target.value)} placeholder="答えを入力してください" aria-label={`問題${question.order}の答え`} /></label>}</AppCard>{error && <p className="notice error" role="alert">{error}</p>}<div className="learn-actions"><button className="button outline" type="button" disabled={current === 0} onClick={() => setCurrent(value => value - 1)}><ArrowLeft aria-hidden="true" size={17} />前の問題</button>{current < materialDocument.questions.length - 1 ? <button className="button" type="button" onClick={() => setCurrent(value => value + 1)}>次の問題<ArrowRight aria-hidden="true" size={17} /></button> : <button className="button" type="button" disabled={busy} onClick={submit}>{busy ? "採点・保存中…" : assignmentId ? "回答を提出して採点" : "回答を保存して採点"}</button>}</div></section>;
}
