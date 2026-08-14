import "server-only";

import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isUserRole, type GradeBand, type Profile } from "./types";

function toProfile(row: Record<string, unknown>): Profile {
  if (!isUserRole(row.role)) throw new Error("プロフィールのロールが不正です。");
  return {
    id: String(row.id),
    role: row.role,
    displayName: String(row.display_name ?? ""),
    gradeBand: (row.grade_band as GradeBand | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export type CurrentUser = { user: User; profile: Profile };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw new Error(`プロフィールの取得に失敗しました: ${error.message}`);
  if (!data) throw new Error("プロフィールが見つかりません。管理者にお問い合わせください。");
  return { user, profile: toProfile(data) };
});
