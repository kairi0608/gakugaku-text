import type { AnswerPayload, MaterialQuestion } from "@/features/materials/shared/types";
import { autoGrade } from "@/lib/grading";

export function answerPayloadToText(answer: AnswerPayload) {
  if (answer.type === "multiple-choice") return answer.values.join(",");
  if (answer.type === "drawing") return "";
  return answer.value;
}

export function answerMatchesQuestion(question: MaterialQuestion, answer: AnswerPayload) {
  return question.answerType === answer.type;
}

export function requiresAiEvaluation(question: MaterialQuestion) {
  if (question.answerType === "drawing") return true;
  if (question.answerType !== "text") return false;
  const wording = `${question.prompt} ${question.instructions ?? ""}`;
  return question.correctAnswer.length > 24 || /説明|理由|考え|作文|記述|なぜ|どのように/.test(wording);
}

export function gradeAnswer(question: MaterialQuestion, answer: AnswerPayload) {
  if (requiresAiEvaluation(question)) return null;
  return autoGrade(question.answerType, answerPayloadToText(answer), question.correctAnswer);
}
