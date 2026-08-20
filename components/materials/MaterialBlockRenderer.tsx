import type { MaterialBlock, MaterialDocument } from "@/features/materials/shared/types";
import { SecureImage } from "@/components/media/SecureImage";
import type { MaterialRenderContext } from "./MaterialRenderer";

export function MaterialBlockRenderer({ block, document, context }: { block: MaterialBlock; document: MaterialDocument; context: MaterialRenderContext }) {
  if (block.type === "title") return <h1 className="material-title">{block.text}</h1>;
  if (block.type === "subtitle") return <p className="material-subtitle">{block.text}</p>;
  if (block.type === "point" || block.type === "example") return <section className={`material-panel ${block.type}`}><h3>{block.title}</h3><p>{block.text}</p></section>;
  if (block.type === "speech-bubble") return <p className="speech">{block.text}</p>;
  if (block.type === "footer-message") return <p className="footer-message">{block.text}</p>;
  if (block.type === "illustration" || block.type === "character") return <figure className="material-asset"><SecureImage landscape src={`/api/assets/${block.assetId}`} alt={block.alt} /></figure>;
  if (block.type === "question") {
    if (context.activeQuestionId && block.questionId !== context.activeQuestionId) return null;
    const question = document.questions.find(item => item.id === block.questionId);
    return question ? <article className="question-card"><span>問題 {question.order}</span>{question.title && <p className="caption">{question.title}</p>}<h3>{question.prompt}</h3>{question.narrative && <p>{question.narrative}</p>}{question.instructions && <p>{question.instructions}</p>}{question.choices?.map(choice => <div key={choice.id}>○ {choice.label}</div>)}</article> : null;
  }
  if (block.type === "answer-field") {
    if (context.activeQuestionId && block.questionId !== context.activeQuestionId) return null;
    const question = document.questions.find(item => item.id === block.questionId);
    if (!question) return null;
    if (context.answerSlot) return <div className="interactive-answer-slot">{context.answerSlot(question)}</div>;
    if (context.mode === "print") {
      if (context.printContent === "questions") return null;
      if (context.printContent === "answers" || context.printContent === "solutions") return <section className="print-answer solution-block"><strong>解答</strong><p>{question.correctAnswer}</p>{context.printContent === "solutions" && <><strong>解説</strong><p>{question.explanation}</p></>}</section>;
      return <section className="print-answer answer-space"><strong>回答欄</strong><div aria-hidden="true" /></section>;
    }
    return <div className="print-answer">答え：</div>;
  }
  return null;
}
