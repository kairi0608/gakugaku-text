import { NextResponse } from "next/server";
import { logAuthError } from "@/lib/auth/log-auth-error";
import { isUserRole, roleDashboard } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : null;
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logAuthError("callback_exchange", error);
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        logAuthError("callback_user", userError ?? new Error("authenticated_user_missing"));
      } else {
        const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (profileError || !profile || !isUserRole(profile.role)) {
          logAuthError("callback_profile", profileError ?? new Error("profile_role_missing"));
        } else {
          return NextResponse.redirect(new URL(next ?? roleDashboard(profile.role), url.origin));
        }
      }
    }
  }
  return NextResponse.redirect(new URL("/auth/login?error=" + encodeURIComponent("認証リンクを確認できませんでした。"), url.origin));
}
