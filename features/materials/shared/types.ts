export type MaterialDocument = {
  version: 1;
  metadata: { title: string; grade: string; subject: string; unit: string; objective: string; difficulty: "easy" | "standard" | "challenge"; description?: string };
  presentation: { mode: "safe-composite" | "full-image"; format: "simple" | "adventure" | "comic" | "picture-book" | "game-card" | "worksheet-poster"; pageSize: "screen" | "a4-portrait" | "a4-landscape" };
  pages: Array<{ id: string; pageNumber: number; backgroundAssetId?: string; altText: string }>;
  questions: Array<{ id: string; pageId: string; order: number; prompt: string; instructions?: string; answerType: "text" | "number" | "choice" | "multiple-choice" | "drawing"; choices?: Array<{ id: string; label: string }>; correctAnswer: string; explanation: string; answerArea?: { x: number; y: number; width: number; height: number } }>;
  feedbackPolicy: { tone: "gentle" | "standard" | "detailed"; revealAnswer: boolean; allowHints: boolean; maxHints?: number };
  accessibility: { highContrast: boolean; largeText: boolean; readingSupport: boolean; imageDescription: string };
};
