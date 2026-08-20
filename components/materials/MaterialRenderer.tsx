import type { ReactNode } from "react";
import type { MaterialDocument, MaterialQuestion } from "@/features/materials/shared/types";
import { MaterialPageRenderer } from "./MaterialPageRenderer";

export type MaterialRenderMode = "screen" | "print" | "interactive" | "history";
export type PrintContent = "questions" | "answer-fields" | "answers" | "solutions";
export type MaterialRenderContext = {
  mode: MaterialRenderMode;
  activeQuestionId?: string;
  printContent?: PrintContent;
  answerSlot?: (question: MaterialQuestion) => ReactNode;
};

export function MaterialRenderer({ document, mode = "screen", activeQuestionId, printContent, answerSlot }: {
  document: MaterialDocument;
  mode?: MaterialRenderMode;
  activeQuestionId?: string;
  printContent?: PrintContent;
  answerSlot?: (question: MaterialQuestion) => ReactNode;
}) {
  const activePageId = activeQuestionId ? document.questions.find(question => question.id === activeQuestionId)?.pageId : undefined;
  const pages = activePageId ? document.pages.filter(page => page.id === activePageId) : document.pages;
  const context: MaterialRenderContext = { mode, activeQuestionId, printContent, answerSlot };
  return <div className={`material-renderer ${mode}`} data-visual-theme={document.presentation.visualTheme} data-format={document.presentation.format}>{pages.map(page => <MaterialPageRenderer key={page.id} page={page} document={document} context={context} />)}</div>;
}
