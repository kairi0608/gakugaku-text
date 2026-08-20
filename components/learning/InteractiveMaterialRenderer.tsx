"use client";

import type { AnswerPayload, MaterialDocument, MaterialQuestion } from "@/features/materials/shared/types";
import { MaterialRenderer } from "@/components/materials/MaterialRenderer";
import { InteractiveAnswerField } from "./InteractiveAnswerField";

export function InteractiveMaterialRenderer({ document, question, answer, drawingBlob, disabled, onAnswerChange, onDrawingChange }: {
  document: MaterialDocument;
  question: MaterialQuestion;
  answer?: AnswerPayload;
  drawingBlob?: Blob | null;
  disabled?: boolean;
  onAnswerChange: (answer: AnswerPayload) => void;
  onDrawingChange: (blob: Blob | null) => void;
}) {
  const hasAnswerBlock = document.pages.some(page => page.blocks.some(block => block.type === "answer-field" && block.questionId === question.id));
  const field = <InteractiveAnswerField question={question} answer={answer} drawingBlob={drawingBlob} disabled={disabled} onChange={onAnswerChange} onDrawingChange={onDrawingChange} />;
  return <div className="interactive-material"><MaterialRenderer document={document} mode="interactive" activeQuestionId={question.id} answerSlot={() => field} />{!hasAnswerBlock && <div className="interactive-answer-fallback">{field}</div>}</div>;
}
