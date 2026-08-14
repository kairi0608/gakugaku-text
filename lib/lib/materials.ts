import "server-only";

import { materialDocumentSchema, type generationInputSchema } from "@/features/materials/shared/schemas";
import type { MaterialDocument } from "@/features/materials/shared/types";
import { autoGrade } from "@/lib/grading";
import { createClient } from "@/lib/supabase/server";
import type { z } from "zod";

export type GenerationInput = z.infer<typeof generationInputSchema>;
export type MaterialRow = { id: string; title: string; currentVersionId: string | null; status: string; createdAt: string; updatedAt: string };
export type VersionRow = { id: string; materialId: string; versionNumber: number; documentJson: MaterialDocument; createdAt: string };
export type AttemptRow = { id: string; materialVersionId: string; learnerName: string; status: string; score: number | null; expAwarded: number; startedAt: string; completedAt: string | null };
export type CharacterRow = { id: string; name: string; stage: string; level: number; exp: number; designJson: Record<string, unknown>; createdAt: string; updatedAt: string };

type DbError = { message: string } | null;
function fail(error: DbError, operation: string) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}
function material(row: Record<string, unknown>): MaterialRow {
  return { id: String(row.id), title: String(row.title), currentVersionId: row.current_version_id ? String(row.current_version_id) : null, status: String(row.status), createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}
function version(row: Record<string, unknown>): VersionRow {
  return { id: String(row.id), materialId: String(row.material_id), versionNumber: Number(row.version_number), documentJson: materialDocumentSchema.parse(row.document_json), createdAt: String(row.created_at) };
}
function attempt(row: Record<string, unknown>): AttemptRow {
  return { id: String(row.id), materialVersionId: String(row.material_version_id), learnerName: String(row.learner_name), status: String(row.status), score: row.score == null ? null : Number(row.score), expAwarded: Number(row.exp_awarded ?? 0), startedAt: String(row.started_at), completedAt: row.completed_at ? String(row.completed_at) : null };
}
function character(row: Record<string, unknown>): CharacterRow {
  return { id: String(row.id), name: String(row.name), stage: String(row.stage), level: Number(row.level), exp: Number(row.exp), designJson: (row.design_json ?? {}) as Record<string, unknown>, createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}

async function authenticatedDatabase() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) throw new Error("ログインが必要です。");
  return { db, user };
}

export async function listMaterials() {
  const db = await createClient();
  const { data, error } = await db.from("hub_materials").select("*").order("updated_at", { ascending: false });
  fail(error, "教材一覧の取得に失敗しました");
  return (data ?? []).map(row => material(row));
}

export async function getMaterial(id: string) {
  const db = await createClient();
  const { data: materialData, error } = await db.from("hub_materials").select("*").eq("id", id).maybeSingle();
  fail(error, "教材の取得に失敗しました");
  if (!materialData?.current_version_id) return null;
  const { data: versionData, error: versionError } = await db.from("hub_material_versions").select("*").eq("id", materialData.current_version_id).maybeSingle();
  fail(versionError, "教材バージョンの取得に失敗しました");
  return versionData ? { ...material(materialData), version: version(versionData), document: materialDocumentSchema.parse(versionData.document_json) } : null;
}

export async function ownsMaterial(id: string, userId: string) {
  const db = await createClient();
  const { data, error } = await db.from("hub_materials").select("owner_id").eq("id", id).maybeSingle();
  fail(error, "教材の所有者確認に失敗しました");
  return data?.owner_id === userId;
}

export async function getMaterialVersion(id: string) {
  const db = await createClient();
  const { data, error } = await db.from("hub_material_versions").select("*").eq("id", id).maybeSingle();
  fail(error, "教材バージョンの取得に失敗しました");
  return data ? version(data) : null;
}

export async function saveMaterial(document: MaterialDocument, materialId?: string) {
  const parsed = materialDocumentSchema.parse(document);
  const { db } = await authenticatedDatabase();
  const { data, error } = await db.rpc("hub_save_material", { p_document: parsed, p_material_id: materialId ?? null });
  fail(error, "教材の保存に失敗しました");
  return String(data);
}

export async function createMaterialDraft(title: string) {
  const { db, user } = await authenticatedDatabase();
  const id = crypto.randomUUID();
  const { error } = await db.from("hub_materials").insert({ id, owner_id: user.id, title, status: "draft" });
  fail(error, "教材の準備に失敗しました");
  return id;
}

export async function deleteEmptyMaterialDraft(id: string) {
  const { db } = await authenticatedDatabase();
  const { error } = await db.from("hub_materials").delete().eq("id", id).is("current_version_id", null).eq("status", "draft");
  if (error) console.error("失敗した教材下書きを整理できませんでした", error);
}

export async function listAttempts() {
  const db = await createClient();
  const { data, error } = await db.from("hub_attempts").select("*").order("started_at", { ascending: false });
  fail(error, "履歴の取得に失敗しました");
  return (data ?? []).map(row => attempt(row));
}

export async function getAttempt(id: string) {
  const db = await createClient();
  const { data, error } = await db.from("hub_attempts").select("*").eq("id", id).maybeSingle();
  fail(error, "学習記録の取得に失敗しました");
  return data ? attempt(data) : null;
}

export async function listCharacters() {
  const db = await createClient();
  const { data, error } = await db.from("hub_characters").select("*").order("updated_at", { ascending: false });
  fail(error, "キャラクターの取得に失敗しました");
  return (data ?? []).map(row => character(row));
}

export async function getCharacter(id: string) {
  const db = await createClient();
  const { data, error } = await db.from("hub_characters").select("*").eq("id", id).maybeSingle();
  fail(error, "キャラクターの取得に失敗しました");
  return data ? character(data) : null;
}

export async function getAttemptHistory() {
  const rows = await listAttempts();
  const ids = [...new Set(rows.map(row => row.materialVersionId))];
  if (!ids.length) return rows.map(row => ({ ...row, versionNumber: null as number | null, materialTitle: null as string | null, materialId: null as string | null }));
  const db = await createClient();
  const { data, error } = await db.from("hub_material_versions").select("id,version_number,material_id").in("id", ids);
  fail(error, "履歴の教材バージョン取得に失敗しました");
  const materialIds = [...new Set((data ?? []).map(row => String(row.material_id)))];
  const result = materialIds.length ? await db.from("hub_materials").select("id,title").in("id", materialIds) : { data: [], error: null };
  fail(result.error, "履歴の教材取得に失敗しました");
  const titles = new Map((result.data ?? []).map(row => [String(row.id), String(row.title)]));
  const versions = new Map((data ?? []).map(row => [String(row.id), { versionNumber: Number(row.version_number), materialId: String(row.material_id) }]));
  return rows.map(row => {
    const item = versions.get(row.materialVersionId);
    return { ...row, versionNumber: item?.versionNumber ?? null, materialId: item?.materialId ?? null, materialTitle: item ? titles.get(item.materialId) ?? null : null };
  });
}

export async function createAttempt(materialVersionId: string, learnerName: string) {
  const { db, user } = await authenticatedDatabase();
  const id = crypto.randomUUID();
  const { error } = await db.from("hub_attempts").insert({ id, material_version_id: materialVersionId, user_id: user.id, learner_name: learnerName, status: "in-progress", started_at: new Date().toISOString(), exp_awarded: 0 });
  fail(error, "学習開始の保存に失敗しました");
  return id;
}

export async function saveAnswer(attemptId: string, questionId: string, answerText: string) {
  const { db } = await authenticatedDatabase();
  const { error } = await db.from("hub_answers").upsert({ attempt_id: attemptId, question_id: questionId, answer_text: answerText, created_at: new Date().toISOString() }, { onConflict: "attempt_id,question_id" });
  fail(error, "回答の保存に失敗しました");
}

export async function createCharacter(input: { name: string; design: Record<string, unknown> }) {
  const { db, user } = await authenticatedDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error } = await db.from("hub_characters").insert({ id, owner_id: user.id, name: input.name, stage: "egg", level: 1, exp: 0, design_json: input.design, created_at: now, updated_at: now });
  fail(error, "キャラクターの保存に失敗しました");
  return id;
}

export async function saveAiFeedback(input: { attemptId: string; questionId: string; feedbackText: string; score: number }) {
  const { db } = await authenticatedDatabase();
  const { error } = await db.from("hub_feedback").insert({ id: crypto.randomUUID(), attempt_id: input.attemptId, question_id: input.questionId, source: "ai", feedback_text: input.feedbackText, score: input.score, created_at: new Date().toISOString() });
  fail(error, "AIフィードバックの保存に失敗しました");
}

export async function saveCompletedAttempt(materialId: string, learnerName: string, inputAnswers: Array<{ questionId: string; answer: string }>, fixedVersionId?: string) {
  const currentMaterial = fixedVersionId ? null : await getMaterial(materialId);
  const fixedVersion = fixedVersionId ? await getMaterialVersion(fixedVersionId) : null;
  if (!currentMaterial && !fixedVersion) throw new Error("教材が見つかりません");
  if (fixedVersion && fixedVersion.materialId !== materialId) throw new Error("課題の教材バージョンが一致しません");
  const document = currentMaterial?.document ?? fixedVersion!.documentJson;
  const materialVersionId = currentMaterial?.version.id ?? fixedVersion!.id;
  const { db, user } = await authenticatedDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  let correct = 0;
  const answerRows: Array<Record<string, unknown>> = [];
  const feedbackRows: Array<Record<string, unknown>> = [];
  for (const item of inputAnswers) {
    const question = document.questions.find(candidate => candidate.id === item.questionId);
    if (!question) continue;
    const requiresAiEvaluation = question.answerType === "text" || question.answerType === "drawing";
    const isCorrect = requiresAiEvaluation ? null : autoGrade(question.answerType, item.answer, question.correctAnswer);
    if (isCorrect) correct++;
    answerRows.push({ id: crypto.randomUUID(), attempt_id: id, question_id: question.id, answer_text: item.answer, is_correct: isCorrect, created_at: now });
    if (!requiresAiEvaluation) {
      feedbackRows.push({ id: crypto.randomUUID(), attempt_id: id, question_id: question.id, source: "auto", feedback_text: isCorrect ? "正解です。よく考えました！" : "ヒントを使って、もう一度考えてみよう。", score: isCorrect ? 100 : 0, created_at: now });
    }
  }
  const score = Math.round(correct / Math.max(1, document.questions.length) * 100);
  const { error } = await db.from("hub_attempts").insert({ id, material_version_id: materialVersionId, user_id: user.id, learner_name: learnerName, status: "completed", score, exp_awarded: 0, started_at: now, completed_at: now });
  fail(error, "提出の保存に失敗しました");
  if (answerRows.length) {
    const result = await db.from("hub_answers").insert(answerRows);
    fail(result.error, "回答の保存に失敗しました");
  }
  if (feedbackRows.length) {
    const result = await db.from("hub_feedback").insert(feedbackRows);
    fail(result.error, "フィードバックの保存に失敗しました");
  }
  const { data: expAwarded, error: expError } = await db.rpc("hub_finalize_attempt_exp", { p_attempt_id: id });
  fail(expError, "EXPの付与に失敗しました");
  return { id, score, autoCorrectCount: correct, expAwarded: Number(expAwarded ?? 0), feedback: score === 100 ? "全問正解！すばらしいです。" : "最後までよくがんばりました。間違えた問題を振り返ってみましょう。" };
}

export async function exportHubData() {
  const db = await createClient();
  const tables = ["hub_materials", "hub_material_versions", "hub_attempts", "hub_answers", "hub_feedback", "hub_characters", "hub_character_assets", "hub_activity_logs", "hub_user_settings"] as const;
  const output: Record<string, unknown[]> = {};
  for (const table of tables) {
    const { data, error } = await db.from(table).select("*");
    fail(error, `${table}のエクスポートに失敗しました`);
    output[table] = data ?? [];
  }
  return { app: "ガクガクAIシステム", version: 3, createdAt: new Date().toISOString(), data: output };
}
