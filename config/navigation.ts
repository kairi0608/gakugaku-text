import type { LucideIcon } from "lucide-react";
import { BookOpen, ClipboardList, Clock3, FilePlus2, GraduationCap, Home, Settings, Sparkles } from "lucide-react";

export type ExperienceRole = "personal" | "student" | "teacher";

export type ExperienceNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPaths?: string[];
};

export const experienceRoleLabels: Record<ExperienceRole, string> = {
  personal: "個人",
  student: "生徒",
  teacher: "教師",
};

export const experienceRoleDescriptions: Record<ExperienceRole, string> = {
  personal: "自分で作る・自分で学ぶ",
  student: "課題を見つけ、解き、結果を見る",
  teacher: "教材を作り、内容を確認する",
};

export function parseExperienceRole(value: string | string[] | null | undefined): ExperienceRole | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "personal" || candidate === "student" || candidate === "teacher" ? candidate : null;
}

export function experienceRoleFromPath(pathname: string): ExperienceRole | null {
  const segment = pathname.split("/")[1];
  return parseExperienceRole(segment);
}

export function withExperienceRole(path: string, role: ExperienceRole) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}from=${role}`;
}

const personalNavigation: ExperienceNavigationItem[] = [
  { href: "/personal", label: "ホーム", icon: Home },
  { href: withExperienceRole("/create", "personal"), label: "教材作成", icon: FilePlus2, matchPaths: ["/create"] },
  { href: withExperienceRole("/materials", "personal"), label: "学習", icon: GraduationCap, matchPaths: ["/materials", "/learn"] },
  { href: withExperienceRole("/history", "personal"), label: "履歴", icon: Clock3, matchPaths: ["/history"] },
  { href: withExperienceRole("/characters", "personal"), label: "キャラクター", icon: Sparkles, matchPaths: ["/characters"] },
  { href: withExperienceRole("/settings", "personal"), label: "設定", icon: Settings, matchPaths: ["/settings"] },
];

const studentNavigation: ExperienceNavigationItem[] = [
  { href: "/student", label: "ホーム", icon: Home },
  { href: withExperienceRole("/materials", "student"), label: "課題", icon: ClipboardList, matchPaths: ["/materials", "/learn"] },
  { href: withExperienceRole("/create", "student"), label: "自主学習", icon: GraduationCap, matchPaths: ["/create"] },
  { href: withExperienceRole("/history", "student"), label: "履歴", icon: Clock3, matchPaths: ["/history"] },
  { href: withExperienceRole("/characters", "student"), label: "キャラクター", icon: Sparkles, matchPaths: ["/characters"] },
  { href: withExperienceRole("/settings", "student"), label: "設定", icon: Settings, matchPaths: ["/settings"] },
];

const teacherNavigation: ExperienceNavigationItem[] = [
  { href: "/teacher", label: "ホーム", icon: Home },
  { href: withExperienceRole("/create", "teacher"), label: "教材作成", icon: FilePlus2, matchPaths: ["/create"] },
  { href: withExperienceRole("/materials", "teacher"), label: "教材管理", icon: BookOpen, matchPaths: ["/materials", "/learn"] },
  { href: withExperienceRole("/settings", "teacher"), label: "設定", icon: Settings, matchPaths: ["/settings"] },
];

export const navigationByRole: Record<ExperienceRole, ExperienceNavigationItem[]> = {
  personal: personalNavigation,
  student: studentNavigation,
  teacher: teacherNavigation,
};

export const mobileNavigationByRole: Record<ExperienceRole, ExperienceNavigationItem[]> = {
  personal: personalNavigation.filter(item => item.label !== "キャラクター"),
  student: [
    studentNavigation[0],
    studentNavigation[1],
    { ...studentNavigation[2], label: "学習" },
    studentNavigation[3],
    studentNavigation[5],
  ],
  teacher: teacherNavigation,
};
