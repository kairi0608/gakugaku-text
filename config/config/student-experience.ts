export type StudentStage = "elementary" | "middle" | "high";

export const defaultStudentStage: StudentStage = "middle";

export function studentStageFromGradeBand(value: string | null | undefined): StudentStage {
  return value === "elementary" || value === "high" ? value : defaultStudentStage;
}

export const studentExperience = {
  elementary: {
    label: "小学生",
    navigation: ["ホーム", "かだい", "れんしゅう", "きろく", "キャラクター"],
    contentDensity: "low",
    conciseCopy: true,
    prominentCharacter: true,
  },
  middle: {
    label: "中学生",
    navigation: ["ホーム", "課題", "演習", "履歴", "キャラクター"],
    contentDensity: "standard",
    conciseCopy: false,
    prominentCharacter: false,
  },
  high: {
    label: "高校生",
    navigation: ["ホーム", "課題", "演習", "分析", "設定"],
    contentDensity: "high",
    conciseCopy: false,
    prominentCharacter: false,
  },
} as const;

export const studentNavigationLabels: Record<StudentStage, readonly string[]> = {
  elementary: ["ホーム", "かだい", "れんしゅう", "きろく", "キャラクター", "せってい"],
  middle: ["ホーム", "課題", "演習", "履歴", "キャラクター", "設定"],
  high: ["ホーム", "課題", "演習", "分析", "キャラクター", "設定"],
};
