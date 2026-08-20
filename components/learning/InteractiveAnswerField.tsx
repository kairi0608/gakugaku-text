"use client";

import type { AnswerPayload, MaterialQuestion } from "@/features/materials/shared/types";
import { HandwritingCanvas } from "./HandwritingCanvas";

export function InteractiveAnswerField({ question, answer, drawingBlob, disabled, onChange, onDrawingChange }: {
  question: MaterialQuestion;
  answer?: AnswerPayload;
  drawingBlob?: Blob | null;
  disabled?: boolean;
  onChange: (answer: AnswerPayload) => void;
  onDrawingChange: (blob: Blob | null) => void;
}) {
  if (question.answerType === "drawing") return <div><p className="field-label">手書き回答</p><HandwritingCanvas disabled={disabled} initialBlob={drawingBlob} onChange={onDrawingChange} /></div>;
  if (question.answerType === "choice") return <fieldset className="choices"><legend>回答を1つ選んでください</legend>{question.choices?.map(choice => <label className="choice" key={choice.id}><input disabled={disabled} type="radio" name={question.id} value={choice.id} checked={answer?.type === "choice" && answer.value === choice.id} onChange={() => onChange({ type: "choice", value: choice.id })} /><span>{choice.label}</span></label>)}</fieldset>;
  if (question.answerType === "multiple-choice") {
    const selected = answer?.type === "multiple-choice" ? answer.values : [];
    return <fieldset className="choices"><legend>当てはまるものをすべて選んでください</legend>{question.choices?.map(choice => <label className="choice" key={choice.id}><input disabled={disabled} type="checkbox" value={choice.id} checked={selected.includes(choice.id)} onChange={event => onChange({ type: "multiple-choice", values: event.target.checked ? [...new Set([...selected, choice.id])] : selected.filter(item => item !== choice.id) })} /><span>{choice.label}</span></label>)}</fieldset>;
  }
  if (question.answerType === "number") return <label className="field"><span className="field-label">数値で回答</span><input disabled={disabled} inputMode="decimal" value={answer?.type === "number" ? answer.value : ""} onChange={event => onChange({ type: "number", value: event.target.value })} aria-label={`問題${question.order}の数値回答`} /></label>;
  return <label className="field"><span className="field-label">回答</span><textarea disabled={disabled} value={answer?.type === "text" ? answer.value : ""} onChange={event => onChange({ type: "text", value: event.target.value })} placeholder="答えを入力してください" aria-label={`問題${question.order}の回答`} /></label>;
}
