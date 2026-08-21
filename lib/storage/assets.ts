import "server-only";

import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import type { ImagePurpose } from "@/lib/ai/image-provider";

const bucket = "gakugaku-assets";
const allowedUploadTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxUploadBytes = 10 * 1024 * 1024;

export class UploadValidationError extends Error {
  readonly status = 400;
}

export async function normalizeUploadedImage(file: File) {
  if (!allowedUploadTypes.has(file.type)) throw new UploadValidationError("PNG、JPEG、WebPのみアップロードできます。");
  if (file.size <= 0 || file.size > maxUploadBytes) throw new UploadValidationError("画像は10MB以下にしてください。");
  const source = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(source, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
  if (!metadata.width || !metadata.height || metadata.width < 320 || metadata.height < 240 || metadata.width > 8000 || metadata.height > 8000) {
    throw new UploadValidationError("画像の寸法は320×240以上、8000×8000以下にしてください。");
  }
  const buffer = await sharp(source, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  const normalized = await sharp(buffer).metadata();
  return { buffer, width: normalized.width ?? metadata.width, height: normalized.height ?? metadata.height };
}

export async function saveVisualAsset(input: {
  ownerId: string;
  kind: ImagePurpose | "photo";
  storagePath: string;
  buffer: Buffer;
  width: number;
  height: number;
  generationType: "ai" | "upload";
  assetSource?: "upload" | "ai-generated" | "system";
  assetKind?: "photo" | "illustration" | "background" | "character" | "diagram";
  metadata?: Record<string, unknown>;
}) {
  const prefix = `users/${input.ownerId}/`;
  if (!input.storagePath.startsWith(prefix) || !input.storagePath.endsWith(".webp")) throw new Error("保存先が不正です。");
  const db = await createClient();
  const upload = await db.storage.from(bucket).upload(input.storagePath, input.buffer, { contentType: "image/webp", upsert: false, cacheControl: "3600" });
  if (upload.error) throw new Error(`画像の保存に失敗しました: ${upload.error.message}`);
  const id = crypto.randomUUID();
  const inferredKind = input.kind === "photo" ? "photo" : input.kind === "material-background" || input.kind === "app-background" ? "background" : ["avatar", "egg", "child", "learning-partner"].includes(input.kind) ? "character" : "illustration";
  const { error } = await db.from("hub_visual_assets").insert({ id, owner_id: input.ownerId, kind: input.kind, storage_path: input.storagePath, mime_type: "image/webp", width: input.width, height: input.height, generation_type: input.generationType, asset_source: input.assetSource ?? (input.generationType === "ai" ? "ai-generated" : "upload"), asset_kind: input.assetKind ?? inferredKind, metadata_json: input.metadata ?? {} });
  if (error) {
    await db.storage.from(bucket).remove([input.storagePath]);
    throw new Error(`画像情報の保存に失敗しました: ${error.message}`);
  }
  return id;
}

export async function getSignedAssetUrl(assetId: string) {
  const db = await createClient();
  const { data, error } = await db.from("hub_visual_assets").select("storage_path").eq("id", assetId).maybeSingle();
  if (error || !data) return null;
  const signed = await db.storage.from(bucket).createSignedUrl(data.storage_path, 60 * 15);
  if (signed.error) throw new Error(`画像URLの発行に失敗しました: ${signed.error.message}`);
  return signed.data.signedUrl;
}

export async function attachVisualAssetsToMaterial(assetIds: string[], materialId: string, materialVersionId: string) {
  if (!assetIds.length) return;
  const db = await createClient();
  const { error } = await db.from("hub_visual_assets").update({ material_id: materialId, material_version_id: materialVersionId }).in("id", assetIds);
  if (error) throw new Error(`教材画像の関連付けに失敗しました: ${error.message}`);
}
