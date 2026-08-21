import "server-only";

import OpenAI from "openai";
import { z } from "zod";
import { AiGenerationError } from "./errors";
import { getTextModel } from "./config";
export { getTextModel } from "./config";

export type StructuredInputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "low" | "high" | "auto" };

export async function generateStructuredContent<TSchema extends z.ZodType>(input: {
  schema: TSchema;
  schemaName: string;
  instructions: string;
  content: StructuredInputContent[];
}): Promise<z.infer<TSchema>> {
  const model = getTextModel();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model,
    instructions: input.instructions,
    input: [{ role: "user", content: input.content }],
    text: {
      format: {
        type: "json_schema",
        name: input.schemaName,
        strict: true,
        schema: z.toJSONSchema(input.schema, { unrepresentable: "any" }),
      },
    },
  });
  if (!response.output_text) throw new AiGenerationError("AIから検証可能な構造化データを取得できませんでした。");
  try {
    return input.schema.parse(JSON.parse(response.output_text));
  } catch {
    throw new AiGenerationError("AI応答が指定したデータ構造を満たしませんでした。");
  }
}

export async function generateStructuredText<TSchema extends z.ZodType>(input: {
  schema: TSchema;
  schemaName: string;
  instructions: string;
  prompt: string;
}): Promise<z.infer<TSchema>> {
  return generateStructuredContent({ ...input, content: [{ type: "input_text", text: input.prompt }] });
}
