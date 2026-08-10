import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : null;
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next) return NextResponse.redirect(new URL(next, url.origin));
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (data?.role) return NextResponse.redirect(new URL(`/${data.role}`, url.origin));
      }
    }
  }
  return NextResponse.redirect(new URL("/auth/login?error=" + encodeURIComponent("認証リンクを確認できませんでした。"), url.origin));
}
