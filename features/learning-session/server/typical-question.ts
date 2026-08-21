import type { AdaptiveQuestion } from "../shared/types";

export function createTypicalQuestion(input: { subject: string; unit: string; difficulty: "easy" | "standard" | "challenge"; order: number; source?: "system-template" | "system-fallback" }): AdaptiveQuestion {
  const source = input.source ?? "system-template";
  if (/算数|数学/.test(input.subject)) {
    const scale = input.difficulty === "easy" ? 3 : input.difficulty === "challenge" ? 9 : 5;
    const left = scale + input.order * 2;
    const right = (input.order % 4) + 2;
    if (/わり算|除法/.test(input.unit)) {
      const answer = left;
      return { id: crypto.randomUUID(), prompt: `${left * right} ÷ ${right} はいくつですか？`, answerType: "number", choices: [], correctAnswer: String(answer), explanation: `${right} × ${answer} = ${left * right}なので、答えは${answer}です。`, difficulty: input.difficulty, typicalPattern: "整数のわり算", generationSource: source };
    }
    const answer = left + right;
    return { id: crypto.randomUUID(), prompt: `${left} + ${right} はいくつですか？`, answerType: "number", choices: [], correctAnswer: String(answer), explanation: `${left}に${right}を加えると${answer}です。`, difficulty: input.difficulty, typicalPattern: "基本計算", generationSource: source };
  }
  return {
    id: crypto.randomUUID(),
    prompt: `「${input.unit}」で学んだ大切なことを、1つ短く説明してください。`,
    answerType: "text",
    choices: [],
    correctAnswer: "単元に関係する内容を自分の言葉で説明できている",
    explanation: "単元の重要語句と、その意味や働きを結び付けられているかを振り返ります。",
    difficulty: input.difficulty,
    typicalPattern: `${input.unit}の基本事項の説明`,
    generationSource: source,
  };
}
