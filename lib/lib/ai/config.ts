import { AiConfigurationError } from "./errors";

export function getTextModel() {
  const model = process.env.OPENAI_TEXT_MODEL;
  if (!process.env.OPENAI_API_KEY || !model) throw new AiConfigurationError("AIテキスト生成の設定が不足しています。OPENAI_API_KEYとOPENAI_TEXT_MODELを設定してください。");
  return model;
}

export function getImageModel() {
  const model = process.env.OPENAI_IMAGE_MODEL;
  if (!process.env.OPENAI_API_KEY || !model) throw new AiConfigurationError("AI画像生成の設定が不足しています。OPENAI_API_KEYとOPENAI_IMAGE_MODELを設定してください。");
  return model;
}
