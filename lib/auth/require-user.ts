import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/features/profiles/roles";
export async function requireUser(roles?: UserRole[]) { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login"); const { data: profile } = await supabase.from("profiles").select("role,display_name").eq("id", user.id).single(); if (!profile || (roles && !roles.includes(profile.role as UserRole))) redirect("/unauthorized"); return { user, profile: profile as { role: UserRole; display_name: string | null }, supabase }; }
