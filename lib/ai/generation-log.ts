import "server-only";

import { createClient } from "@/lib/supabase/server";

export type GenerationFeature = "material" | "material-image" | "evaluation" | "character-design" | "character-image" | "background";

export async function startGeneration(input: { userId: string; feature: GenerationFeature; model: string; metadata?: Record<string, unknown> }) {
  const db = await createClient();
  const id = crypto.randomUUID();
  const { error } = await db.from("hub_ai_generations").insert({ id, user_id: input.userId, feature: input.feature, model: input.model, status: "running", metadata_json: input.metadata ?? {} });
  if (error) throw new Error(`AI生成ログを開始できませんでした: ${error.message}`);
  return id;
}

export async function finishGeneration(id: string, succeeded: boolean, errorCode?: string) {
  const db = await createClient();
  const { error } = await db.from("hub_ai_generations").update({ status: succeeded ? "succeeded" : "failed", error_code: errorCode ?? null, completed_at: new Date().toISOString() }).eq("id", id);
  if (error) console.error("AI生成ログの更新に失敗しました", error);
}
