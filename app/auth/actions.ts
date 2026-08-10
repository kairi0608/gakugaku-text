"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { gradeBands, roleDashboard } from "@/lib/auth/types";

const emailSchema = z.string().email("メールアドレスを確認してください。");
const passwordSchema = z.string().min(8, "パスワードは8文字以上で入力してください。").max(128);
const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
};

function authRedirect(path: string, type: "error" | "message", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export async function loginAction(formData: FormData) {
  const parsed = z.object({ email: emailSchema, password: z.string().min(1) }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) authRedirect("/auth/login", "error", "メールアドレスとパスワードを確認してください。");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) authRedirect("/auth/login", "error", "ログインできませんでした。入力内容を確認してください。");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) authRedirect("/auth/login", "error", "セッションを確認できませんでした。");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile) authRedirect("/auth/login", "error", "プロフィールを確認できませんでした。");
  redirect(safeNext(formData.get("next")) ?? roleDashboard(profile.role));
}

export async function signupAction(formData: FormData) {
  const parsed = z.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().trim().min(1).max(80),
    role: z.enum(["personal", "student"]),
    gradeBand: z.enum(gradeBands).optional(),
  }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    gradeBand: formData.get("gradeBand") || undefined,
  });
  if (!parsed.success) authRedirect("/auth/signup", "error", "入力内容を確認してください。パスワードは8文字以上必要です。");

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: {
        display_name: parsed.data.displayName,
        requested_role: parsed.data.role,
        grade_band: parsed.data.role === "student" ? parsed.data.gradeBand ?? "other" : null,
      },
    },
  });
  if (error) authRedirect("/auth/signup", "error", "アカウントを作成できませんでした。別のメールアドレスもお試しください。");
  if (data.session) redirect(roleDashboard(parsed.data.role));
  authRedirect("/auth/login", "message", "確認メールを送信しました。メール内のリンクから登録を完了してください。");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) authRedirect("/auth/forgot-password", "error", "メールアドレスを確認してください。");
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl}/auth/callback?next=/auth/reset-password`,
  });
  if (error) authRedirect("/auth/forgot-password", "error", "再設定メールを送信できませんでした。");
  authRedirect("/auth/login", "message", "パスワード再設定メールを送信しました。");
}

export async function resetPasswordAction(formData: FormData) {
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("passwordConfirmation");
  if (!password.success || password.data !== confirmation) {
    authRedirect("/auth/reset-password", "error", "8文字以上の同じパスワードを2回入力してください。");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) authRedirect("/auth/reset-password", "error", "パスワードを更新できませんでした。再設定リンクを開き直してください。");
  authRedirect("/auth/login", "message", "パスワードを更新しました。新しいパスワードでログインしてください。");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
