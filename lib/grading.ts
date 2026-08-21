export function normalize(value: string) {
  return value.trim().normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

export function autoGrade(type: string, answer: string, correct: string) {
  if (type === "number") {
    const actual = Number(normalize(answer));
    const expected = Number(normalize(correct));
    return Number.isFinite(actual) && Number.isFinite(expected) && actual === expected;
  }
  if (type === "multiple-choice") {
    const actual = answer.split(",").map(normalize).filter(Boolean).sort();
    const expected = correct.split(",").map(normalize).filter(Boolean).sort();
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
  return normalize(answer) === normalize(correct);
}
