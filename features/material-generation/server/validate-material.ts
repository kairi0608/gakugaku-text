import "server-only";

import { materialDocumentSchema } from "@/features/materials/shared/schemas";
import type { MaterialDocument } from "@/features/materials/shared/types";
import type { GenerationInput } from "@/lib/materials";

export function validateGeneratedMaterial(value: unknown, input: GenerationInput, options: { allowAssetPlaceholders?: boolean } = {}): MaterialDocument {
  const document = materialDocumentSchema.parse(value);
  if (document.questions.length !== input.questionCount) throw new Error("生成された問題数が指定と一致しません。");
  if (document.metadata.grade !== input.grade || document.metadata.subject !== input.subject || document.metadata.unit !== input.unit) {
    throw new Error("生成教材の学年・教科・単元が指定と一致しません。");
  }
  const pageIds = new Set(document.pages.map(page => page.id));
  if (pageIds.size !== document.pages.length) throw new Error("ページIDが重複しています。");
  const questionIds = new Set<string>();
  for (const question of document.questions) {
    if (!pageIds.has(question.pageId)) throw new Error("問題が存在しないページを参照しています。");
    if (questionIds.has(question.id)) throw new Error("問題IDが重複しています。");
    questionIds.add(question.id);
    if ((question.answerType === "choice" || question.answerType === "multiple-choice") && (!question.choices || question.choices.length < 2)) {
      throw new Error("選択式問題には2つ以上の選択肢が必要です。");
    }
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
  return document;
}
