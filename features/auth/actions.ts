"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function login(form: FormData) { const supabase = await createClient(); const email = String(form.get("email")); const password = String(form.get("password")); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) redirect(`/auth/login?error=${encodeURIComponent("ログインできませんでした")}`); redirect("/auth/callback"); }
export async function signup(form: FormData) { const supabase = await createClient(); const email = String(form.get("email")); const password = String(form.get("password")); const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: String(form.get("displayName")) } } }); if (error) redirect(`/auth/signup?error=${encodeURIComponent("登録できませんでした")}`); redirect("/auth/login?message=確認メールをご確認ください"); }
export async function logout() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/"); }
export async function forgot(form: FormData) { const supabase = await createClient(); await supabase.auth.resetPasswordForEmail(String(form.get("email")), { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password` }); redirect("/auth/login?message=再設定メールを送信しました"); }
export async function reset(form: FormData) { const supabase = await createClient(); await supabase.auth.updateUser({ password: String(form.get("password")) }); redirect("/auth/login?message=パスワードを更新しました"); }
