export type StudentStage = "elementary" | "middle" | "high";

export const defaultStudentStage: StudentStage = "middle";

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
