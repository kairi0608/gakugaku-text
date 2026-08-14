import "server-only";

import OpenAI from "openai";
import sharp from "sharp";
import { AiGenerationError } from "./errors";
import { getImageModel } from "./config";
export { getImageModel } from "./config";

export type ImagePurpose = "material-background" | "material-scene" | "avatar" | "egg" | "child" | "learning-partner" | "app-background";

const safetyByPurpose: Record<ImagePurpose, string> = {
  "material-background": "学習教材用の背景。文字、数字、ロゴ、透かし、UIを含めない。中央は読みやすい余白を保つ。",
  "material-scene": "学習教材用の一場面。文字、数字、ロゴ、透かしを含めない。年齢に適した穏やかな表現。",
  avatar: "親しみやすい学習アバター1体。文字、ロゴ、透かしなし。",
  egg: "オリジナルのタマゴまたは繭のキャラクター1体。完成形の人物を描かない。正方形、文字、ロゴ、透かしなし。怖くない表現。",
  child: "成長途中のオリジナル学習キャラクター1体。元の色とモチーフを保つ。正方形、文字、ロゴ、透かしなし。",
  "learning-partner": "頼れるオリジナル学習パートナー1体。元の色とモチーフを保つ。正方形、文字、ロゴ、透かしなし。",
  "app-background": "学習アプリ用の静かな背景のみ。文字、UI、ロゴ、人物、特定作品を含めない。中央の情報量を抑え、読みやすくする。",
};

export async function generateImage(input: { purpose: ImagePurpose; prompt: string; userId: string; landscape?: boolean }) {
  const model = getImageModel();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.images.generate({
    model,
    prompt: `${safetyByPurpose[input.purpose]}\n希望: ${input.prompt}`,
    n: 1,
    size: input.landscape ? "1536x1024" : "1024x1024",
    quality: "medium",
    output_format: "webp",
    output_compression: 88,
    user: input.userId,
  });
  const base64 = response.data?.[0]?.b64_json;
  if (!base64) throw new AiGenerationError("AI画像データを取得できませんでした。");
  const source = Buffer.from(base64, "base64");
  const metadata = await sharp(source, { failOn: "error" }).metadata();
  if (!metadata.width || !metadata.height || metadata.width > 4096 || metadata.height > 4096) {
    throw new AiGenerationError("生成画像の寸法が安全基準を満たしていません。");
  }
  const buffer = await sharp(source).rotate().resize({ width: input.landscape ? 1536 : 1024, height: input.landscape ? 1024 : 1024, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  const normalized = await sharp(buffer).metadata();
  return { buffer, width: normalized.width ?? metadata.width, height: normalized.height ?? metadata.height, model };
}
