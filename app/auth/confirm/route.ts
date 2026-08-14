import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { logAuthError } from "@/lib/auth/log-auth-error";
import { isUserRole, roleDashboard } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      logAuthError("confirm_verify_otp", error);
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        logAuthError("confirm_user", userError ?? new Error("authenticated_user_missing"));
      } else {
        const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (profileError || !profile || !isUserRole(profile.role)) {
          logAuthError("confirm_profile", profileError ?? new Error("profile_role_missing"));
        } else {
          return NextResponse.redirect(new URL(roleDashboard(profile.role), url.origin));
        }
      }
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=" + encodeURIComponent("認証リンクを確認できませんでした。新しい確認メールを再送してください。"), url.origin));
}
