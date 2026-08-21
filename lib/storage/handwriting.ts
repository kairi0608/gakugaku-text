import "server-only";

import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";

const bucket = "gakugaku-assets";
const allowedTypes = new Set(["image/png", "image/webp"]);
const maxBytes = 6 * 1024 * 1024;

export class HandwritingValidationError extends Error {
  readonly status = 400;
}

export async function normalizeHandwritingImage(file: File) {
  if (!allowedTypes.has(file.type)) throw new HandwritingValidationError("手書き画像はPNGまたはWebPのみ送信できます。");
  if (file.size <= 0 || file.size > maxBytes) throw new HandwritingValidationError("手書き画像は6MB以下にしてください。");
  const source = Buffer.from(await file.arrayBuffer());
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(source, { failOn: "error", limitInputPixels: 16_000_000 }).metadata();
  } catch {
    throw new HandwritingValidationError("手書き画像を読み取れませんでした。");
  }
  if (!metadata.width || !metadata.height || metadata.width < 64 || metadata.height < 64 || metadata.width > 4096 || metadata.height > 4096) throw new HandwritingValidationError("手書き画像の寸法が許容範囲外です。");
  const buffer = await sharp(source, { failOn: "error", limitInputPixels: 16_000_000 }).rotate().flatten({ background: "#ffffff" }).resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
  const normalized = await sharp(buffer).metadata();
  return { buffer, width: normalized.width ?? metadata.width, height: normalized.height ?? metadata.height };
}

export async function saveHandwritingAsset(input: { ownerId: string; attemptId: string; questionId: string; buffer: Buffer; width: number; height: number }) {
  const db = await createClient();
  const existing = await db.from("hub_answer_assets").select("id,storage_path").eq("attempt_id", input.attemptId).eq("question_id", input.questionId).maybeSingle();
  if (existing.error) throw existing.error;
  const id = existing.data?.id ?? crypto.randomUUID();
  const storagePath = `users/${input.ownerId}/attempts/${input.attemptId}/${encodeURIComponent(input.questionId)}/handwriting-${crypto.randomUUID()}.webp`;
  const uploaded = await db.storage.from(bucket).upload(storagePath, input.buffer, { contentType: "image/webp", cacheControl: "3600", upsert: false });
  if (uploaded.error) throw new Error(`手書き画像を保存できませんでした: ${uploaded.error.message}`);
  const row = { id, attempt_id: input.attemptId, question_id: input.questionId, owner_id: input.ownerId, storage_path: storagePath, mime_type: "image/webp", width: input.width, height: input.height, recognized_text: null, recognition_confidence: null, recognition_notes: null };
  const saved = existing.data ? await db.from("hub_answer_assets").update(row).eq("id", id) : await db.from("hub_answer_assets").insert(row);
  if (saved.error) {
    await db.storage.from(bucket).remove([storagePath]);
    throw new Error(`手書き回答情報を保存できませんでした: ${saved.error.message}`);
  }
  if (existing.data?.storage_path && existing.data.storage_path !== storagePath) await db.storage.from(bucket).remove([existing.data.storage_path]);
  return id;
}

export async function getSignedHandwritingUrl(assetId: string) {
  const db = await createClient();
  const asset = await db.from("hub_answer_assets").select("storage_path").eq("id", assetId).maybeSingle();
  if (asset.error || !asset.data) return null;
  const signed = await db.storage.from(bucket).createSignedUrl(asset.data.storage_path, 60 * 10);
  if (signed.error) throw new Error(`手書き画像URLを発行できませんでした: ${signed.error.message}`);
  return signed.data.signedUrl;
}

export async function downloadHandwritingDataUrl(storagePath: string) {
  const db = await createClient();
  const downloaded = await db.storage.from(bucket).download(storagePath);
  if (downloaded.error) throw new Error(`手書き画像を取得できませんでした: ${downloaded.error.message}`);
  const bytes = Buffer.from(await downloaded.data.arrayBuffer());
  if (bytes.length > maxBytes) throw new HandwritingValidationError("手書き画像のサイズが上限を超えています。");
  return `data:image/webp;base64,${bytes.toString("base64")}`;
}
