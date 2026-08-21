"use client";

import { CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdaptiveQuestion, SetFeedback } from "@/features/learning-session/shared/types";

type SessionState = { id: string; status: string; target: number; completed: number; score: number | null; exp: number; feedbackStatus: string };

export function SessionGame({ initialSession, initialQuestion, initialFeedback }: { initialSession: SessionState; initialQuestion?: AdaptiveQuestion; initialFeedback?: SetFeedback }) {
  const [session, setSession] = useState(initialSession);
  const [question, setQuestion] = useState(initialQuestion);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<"answering" | "saving" | "next" | "feedback">("answering");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session.status === "active" && !question && session.completed < session.target) void loadNext();
    // Initial recovery only; loadNext updates all referenced state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function json(url: string, init: RequestInit) {
    const response = await fetch(url, init); const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "処理を完了できませんでした。"); return body;
  }
  async function loadNext() {
    setPhase("next"); setError("");
    try { const body = await json(`/api/learning-sessions/${session.id}/next-question`, { method: "POST" }); setQuestion(body.question); setNotice(body.notice ?? ""); setAnswer(""); setPhase("answering"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "次の問題を準備できませんでした。"); setPhase("answering"); }
  }
  async function complete() {
    setPhase("feedback");
    try { const body = await json(`/api/learning-sessions/${session.id}/complete`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); setFeedback(body.feedback); setSession(previous => ({ ...previous, status: "completed", score: body.score, exp: body.expAwarded, feedbackStatus: body.feedbackStatus })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "結果をまとめられませんでした。"); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!question || !answer.trim()) return;
    setPhase("saving"); setError("");
    try {
      const body = await json(`/api/learning-sessions/${session.id}/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: question.id, answer }) });
      const completed = session.completed + 1; setSession(previous => ({ ...previous, completed })); setQuestion(undefined);
      if (body.setComplete) await complete(); else await loadNext();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "回答を保存できませんでした。"); setPhase("answering"); }
  }

  if (session.status === "completed" && feedback) return <section className="game-result"><div className="game-result-hero"><CheckCircle2 aria-hidden="true" size={44} /><p className="eyebrow">RESULT</p><h1>{session.target}問チャレンジ完了</h1>{session.score !== null && <div className="score">{session.score}点</div>}<p>{feedback.summary}</p><p className="exp-earned">+{session.exp} EXP</p></div><div className="game-feedback-short"><p><strong>できていたこと</strong><br />{feedback.strength}</p><p><strong>次の一歩</strong><br />{feedback.nextStep}</p></div>{session.feedbackStatus === "failed" && <p className="notice warning">AIまとめを取得できなかったため、保存済み結果から短い案内を表示しています。</p>}<div className="actions mobile-stack"><Link className="button" href="/student">ホームへ</Link><Link className="button outline" href="/student/practice">もう一度チャレンジ</Link><Link className="button secondary" href="/history">履歴を見る</Link></div></section>;

  const currentNumber = Math.min(session.completed + 1, session.target);
  const progress = Math.round(session.completed / session.target * 100);
  return <section className="session-game"><header className="game-header"><div><p className="eyebrow">GAME SESSION</p><strong>問題 {currentNumber} / {session.target}</strong></div><div className="game-character" aria-label="学習パートナーのリアクション"><Sparkles aria-hidden="true" />いっしょに考えよう</div></header><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>{notice && <p className="notice">{notice}</p>}{phase !== "answering" || !question ? <div className="game-loading" aria-live="polite"><span className="game-loader" /><h2>{phase === "saving" ? "回答を保存しています" : phase === "feedback" ? "今回の学習をまとめています" : "次の問題を準備しています"}</h2></div> : <form className="game-question-card" onSubmit={submit}><span className="question-number">QUESTION {currentNumber}</span><h1>{question.prompt}</h1>{question.answerType === "choice" ? <div className="game-choices">{question.choices.map(choice => <label key={choice.id} className={answer === choice.id ? "selected" : ""}><input type="radio" name="answer" value={choice.id} checked={answer === choice.id} onChange={() => setAnswer(choice.id)} /><span>{choice.label}</span></label>)}</div> : question.answerType === "number" ? <label className="field game-answer"><span>答え</span><input autoFocus inputMode="decimal" value={answer} onChange={event => setAnswer(event.target.value)} /></label> : <label className="field game-answer"><span>自分の考え</span><textarea autoFocus value={answer} onChange={event => setAnswer(event.target.value)} /></label>}<button className="button game-next-button" disabled={!answer.trim()}>回答を決める<ChevronRight aria-hidden="true" size={19} /></button></form>}{error && <div className="notice error" role="alert">{error}<button className="button outline" type="button" onClick={question ? () => setError("") : loadNext}>もう一度試す</button></div>}<p className="game-exp-preview">セット完了で 20 EXP</p></section>;
}
