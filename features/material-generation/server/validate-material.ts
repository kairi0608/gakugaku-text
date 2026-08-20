import "server-only";

import { materialDocumentSchema } from "@/features/materials/shared/schemas";
import type { MaterialDocument } from "@/features/materials/shared/types";
import type { GenerationInput } from "@/lib/materials";
import { normalize } from "@/lib/grading";

export function validateGeneratedMaterial(value: unknown, input: GenerationInput, options: { allowAssetPlaceholders?: boolean } = {}): MaterialDocument {
  const document = materialDocumentSchema.parse(value);
  if (document.questions.length !== input.questionCount) throw new Error("生成された問題数が指定と一致しません。");
  if (document.metadata.grade !== input.grade || document.metadata.subject !== input.subject || document.metadata.unit !== input.unit) {
    throw new Error("生成教材の学年・教科・単元が指定と一致しません。");
  }
  const pageIds = new Set(document.pages.map(page => page.id));
  if (pageIds.size !== document.pages.length) throw new Error("ページIDが重複しています。");
  const questionIds = new Set<string>();
  const questionOrders = new Set<number>();
  for (const question of document.questions) {
    if (!pageIds.has(question.pageId)) throw new Error("問題が存在しないページを参照しています。");
    if (questionIds.has(question.id)) throw new Error("問題IDが重複しています。");
    questionIds.add(question.id);
    if (questionOrders.has(question.order)) throw new Error("問題番号が重複しています。");
    questionOrders.add(question.order);
    if (!question.correctAnswer.trim() || !question.explanation.trim()) throw new Error("正答または解説が不足しています。");
    if ((question.answerType === "choice" || question.answerType === "multiple-choice") && (!question.choices || question.choices.length < 2)) {
      throw new Error("選択式問題には2つ以上の選択肢が必要です。");
    }
    const choiceIds = new Set(question.choices?.map(choice => choice.id) ?? []);
    if (choiceIds.size !== (question.choices?.length ?? 0)) throw new Error("選択肢IDが重複しています。");
    if (question.answerType === "choice" && !choiceIds.has(question.correctAnswer)) throw new Error("選択式問題の正答が選択肢と一致しません。");
    if (question.answerType === "multiple-choice") {
      const correctIds = question.correctAnswer.split(",").map(value => value.trim()).filter(Boolean);
      if (!correctIds.length || correctIds.some(id => !choiceIds.has(id))) throw new Error("複数選択問題の正答が選択肢と一致しません。");
    }
    if (question.answerType === "number" && !Number.isFinite(Number(normalize(question.correctAnswer)))) throw new Error("数値問題の正答が数値ではありません。");
  }
  for (const page of document.pages) {
    const blockIds = new Set<string>();
    for (const block of page.blocks) {
      if (blockIds.has(block.id)) throw new Error("ブロックIDが重複しています。");
      blockIds.add(block.id);
      if ((block.type === "question" || block.type === "answer-field") && !questionIds.has(block.questionId)) throw new Error("問題ブロックの参照先が不正です。");
      if (!options.allowAssetPlaceholders && (block.type === "illustration" || block.type === "character") && block.assetId.startsWith("brief:")) throw new Error("画像が生成されていません。");
    }
    if (!options.allowAssetPlaceholders && page.backgroundAssetId?.startsWith("brief:")) throw new Error("背景画像が生成されていません。");
  }
  const renderedQuestionIds = new Set(document.pages.flatMap(page => page.blocks.filter(block => block.type === "question").map(block => block.questionId)));
  if ([...questionIds].some(questionId => !renderedQuestionIds.has(questionId))) throw new Error("教材ページに表示されない問題があります。");
  return document;
}
