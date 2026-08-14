import type { LucideIcon } from "lucide-react";
import { Activity, BookOpen, ClipboardCheck, ClipboardList, Clock3, FilePlus2, GraduationCap, Home, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { UserRole } from "@/lib/auth/types";

export type ExperienceRole = UserRole;
export type ExperienceNavigationItem = { href: string; label: string; icon: LucideIcon; matchPaths?: string[] };

export const experienceRoleLabels: Record<ExperienceRole, string> = { personal: "個人", student: "生徒", teacher: "教師", admin: "管理者" };
export const experienceRoleDescriptions: Record<ExperienceRole, string> = {
  personal: "自分で作る・自分で学ぶ",
  student: "課題と自主学習を進める",
  teacher: "教材・クラス・提出を管理する",
  admin: "利用状況と権限を確認する",
};

export function parseExperienceRole(value: string | string[] | null | undefined): ExperienceRole | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "personal" || candidate === "student" || candidate === "teacher" || candidate === "admin" ? candidate : null;
}
export function experienceRoleFromPath(pathname: string) { return parseExperienceRole(pathname.split("/")[1]); }
export function withExperienceRole(path: string, role: ExperienceRole) { const separator = path.includes("?") ? "&" : "?"; return `${path}${separator}from=${role}`; }

const personal: ExperienceNavigationItem[] = [
  { href: "/personal", label: "ホーム", icon: Home },
  { href: withExperienceRole("/create", "personal"), label: "教材作成", icon: FilePlus2, matchPaths: ["/create"] },
  { href: withExperienceRole("/materials", "personal"), label: "学習", icon: GraduationCap, matchPaths: ["/materials", "/learn"] },
  { href: withExperienceRole("/history", "personal"), label: "履歴", icon: Clock3, matchPaths: ["/history"] },
  { href: withExperienceRole("/characters", "personal"), label: "キャラクター", icon: Sparkles, matchPaths: ["/characters"] },
  { href: withExperienceRole("/settings", "personal"), label: "設定", icon: Settings, matchPaths: ["/settings"] },
];
const student: ExperienceNavigationItem[] = [
  { href: "/student", label: "ホーム", icon: Home },
  { href: "/student/assignments", label: "課題", icon: ClipboardList, matchPaths: ["/student/assignments", "/learn"] },
  { href: withExperienceRole("/create", "student"), label: "自主学習", icon: GraduationCap, matchPaths: ["/create"] },
  { href: withExperienceRole("/history", "student"), label: "履歴", icon: Clock3, matchPaths: ["/history"] },
  { href: withExperienceRole("/characters", "student"), label: "キャラクター", icon: Sparkles, matchPaths: ["/characters"] },
  { href: withExperienceRole("/settings", "student"), label: "設定", icon: Settings, matchPaths: ["/settings"] },
];
const teacher: ExperienceNavigationItem[] = [
  { href: "/teacher", label: "ホーム", icon: Home },
  { href: withExperienceRole("/create", "teacher"), label: "教材作成", icon: FilePlus2, matchPaths: ["/create"] },
  { href: withExperienceRole("/materials", "teacher"), label: "教材管理", icon: BookOpen, matchPaths: ["/materials"] },
  { href: "/teacher/classrooms", label: "クラス", icon: Users },
  { href: "/teacher/assignments", label: "課題", icon: ClipboardList },
  { href: "/teacher/submissions", label: "提出", icon: ClipboardCheck },
  { href: withExperienceRole("/settings", "teacher"), label: "設定", icon: Settings, matchPaths: ["/settings"] },
];
const admin: ExperienceNavigationItem[] = [
  { href: "/admin", label: "管理ホーム", icon: Home },
  { href: "/admin/users", label: "ユーザー", icon: Users },
  { href: "/admin/generations", label: "生成状況", icon: Activity },
  { href: "/admin/system", label: "システム", icon: ShieldCheck },
  { href: "/personal", label: "個人ページ", icon: GraduationCap },
  { href: "/student", label: "生徒ページ", icon: ClipboardList },
  { href: "/teacher", label: "教師ページ", icon: BookOpen },
  { href: withExperienceRole("/settings", "admin"), label: "設定", icon: Settings, matchPaths: ["/settings"] },
];

export const navigationByRole: Record<ExperienceRole, ExperienceNavigationItem[]> = { personal, student, teacher, admin };
export const mobileNavigationByRole: Record<ExperienceRole, ExperienceNavigationItem[]> = {
  personal: [personal[0], personal[1], personal[2], personal[3], personal[5]],
  student: [student[0], student[1], student[2], student[3], student[5]],
  teacher: [teacher[0], teacher[1], teacher[3], teacher[4], teacher[5]],
  admin: [admin[0], admin[4], admin[5], admin[6], admin[3]],
};
