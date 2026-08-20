import type { MaterialDocument } from "@/features/materials/shared/types";
import { MaterialRenderer, type PrintContent } from "./MaterialRenderer";

function withAnswerFields(document: MaterialDocument): MaterialDocument {
  const existing = new Set(document.pages.flatMap(page => page.blocks.filter(block => block.type === "answer-field").map(block => block.questionId)));
  return { ...document, pages: document.pages.map(page => ({ ...page, blocks: page.blocks.flatMap(block => block.type === "question" && !existing.has(block.questionId) ? [block, { id: `print-answer-${block.questionId}`, type: "answer-field" as const, questionId: block.questionId }] : [block]) })) };
}

export function MaterialPrintView({ document, content = "answer-fields", orientation }: { document: MaterialDocument; content?: PrintContent; orientation?: "a4-portrait" | "a4-landscape" }) {
  const printable = withAnswerFields({ ...document, presentation: { ...document.presentation, pageSize: orientation ?? (document.presentation.pageSize === "a4-landscape" ? "a4-landscape" : "a4-portrait") } });
  return <div className="print-view"><MaterialRenderer document={printable} mode="print" printContent={content} /></div>;
}
