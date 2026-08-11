"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AppUrlConfigurationError, getAppUrl } from "@/lib/auth/app-url";
import { getAuthEmailMessage, getAuthErrorCode, isAuthRateLimit, logAuthError } from "@/lib/auth/log-auth-error";
import { safeRoleNext } from "@/lib/auth/safe-next";
import { signupRoleSchema } from "@/lib/auth/signup-schema";
import { gradeBands, isUserRole, roleDashboard } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().email("メールアドレスを確認してください。");
const passwordSchema = z.string().min(8, "パスワードは8文字以上で入力してください。").max(128);
function authRedirect(path: string, type: "error" | "message", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function appUrlForAuth(path: string) {
  try {
    return getAppUrl();
  } catch (error) {
    logAuthError("app_url", error);
    if (error instanceof AppUrlConfigurationError) authRedirect(path, "error", "メール送信先URLの設定を確認中です。管理者にお問い合わせください。");
    throw error;
  }
}

export async function loginAction(formData: FormData) {
  const parsed = z.object({ email: emailSchema, password: z.string().min(1) }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) authRedirect("/auth/login", "error", "メールアドレスとパスワードを確認してください。");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logAuthError("login", error);
    authRedirect("/auth/login", "error", "ログインできませんでした。入力内容を確認してください。");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) authRedirect("/auth/login", "error", "セッションを確認できませんでした。");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profileError || !profile || !isUserRole(profile.role)) {
    logAuthError("login_profile", profileError ?? new Error("profile_role_missing"));
    authRedirect("/auth/login", "error", "プロフィールを確認できませんでした。");
  }
  redirect(safeRoleNext(formData.get("next"), profile.role) ?? roleDashboard(profile.role));
}

export async function signupAction(formData: FormData) {
  const parsed = z.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().trim().min(1).max(80),
    role: signupRoleSchema,
    gradeBand: z.enum(gradeBands).optional(),
  }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    gradeBand: formData.get("gradeBand") || undefined,
  });
  if (!parsed.success) authRedirect("/auth/signup", "error", "入力内容を確認してください。パスワードは8文字以上必要です。");

  const appUrl = appUrlForAuth("/auth/signup");
  const supabase = await createClient();
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
  if (error) {
    logAuthError("signup", error);
    authRedirect("/auth/signup", "error", getAuthEmailMessage(error));
  }
  if (data.session && data.user) {
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profileError || !profile || !isUserRole(profile.role)) {
      logAuthError("signup_profile", profileError ?? new Error("profile_role_missing"));
      authRedirect("/auth/login", "error", "プロフィールを確認できませんでした。");
    }
    redirect(roleDashboard(profile.role));
  }
  redirect("/auth/check-email");
}

export async function resendSignupConfirmationAction(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) authRedirect("/auth/check-email", "error", "メールアドレスを確認してください。");
  const appUrl = appUrlForAuth("/auth/check-email");
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data, options: { emailRedirectTo: `${appUrl}/auth/callback` } });
  if (error) {
    logAuthError("resend_signup", error);
    if (isAuthRateLimit(error)) authRedirect("/auth/check-email", "error", getAuthEmailMessage(error));
    if (getAuthErrorCode(error) !== "user_not_found") authRedirect("/auth/check-email", "error", getAuthEmailMessage(error));
  }
  authRedirect("/auth/check-email", "message", "該当する登録がある場合、確認メールを再送しました。");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) authRedirect("/auth/forgot-password", "error", "メールアドレスを確認してください。");
  const appUrl = appUrlForAuth("/auth/forgot-password");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${appUrl}/auth/callback?next=/auth/reset-password` });
  if (error) {
    logAuthError("password_reset_email", error);
    authRedirect("/auth/forgot-password", "error", isAuthRateLimit(error) ? "しばらく待ってからもう一度お試しください。" : "再設定メールを送信できませんでした。");
  }
  authRedirect("/auth/login", "message", "該当する登録がある場合、パスワード再設定メールを送信しました。");
}

export async function resetPasswordAction(formData: FormData) {
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("passwordConfirmation");
  if (!password.success || password.data !== confirmation) authRedirect("/auth/reset-password", "error", "8文字以上の同じパスワードを2回入力してください。");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    logAuthError("password_update", error);
    authRedirect("/auth/reset-password", "error", "パスワードを更新できませんでした。再設定リンクを開き直してください。");
  }
  authRedirect("/auth/login", "message", "パスワードを更新しました。新しいパスワードでログインしてください。");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
