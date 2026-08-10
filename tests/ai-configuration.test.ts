import { afterEach, describe, expect, it } from "vitest";
import { AiConfigurationError } from "../lib/ai/errors";
import { getImageModel, getTextModel } from "../lib/ai/config";
import { aiMaterialDocumentSchema } from "../features/material-generation/server/ai-material-schema";

const original = { key: process.env.OPENAI_API_KEY, text: process.env.OPENAI_TEXT_MODEL, image: process.env.OPENAI_IMAGE_MODEL };
afterEach(() => {
  if (original.key === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = original.key;
  if (original.text === undefined) delete process.env.OPENAI_TEXT_MODEL; else process.env.OPENAI_TEXT_MODEL = original.text;
  if (original.image === undefined) delete process.env.OPENAI_IMAGE_MODEL; else process.env.OPENAI_IMAGE_MODEL = original.image;
});

describe("AI provider configuration", () => {
  it("fails explicitly instead of returning sample content", () => {
    delete process.env.OPENAI_API_KEY;
    process.env.OPENAI_TEXT_MODEL = "configured-model";
    expect(() => getTextModel()).toThrow(AiConfigurationError);
    expect(() => getTextModel()).toThrow("OPENAI_API_KEY");
  });
  it("requires independent text and image model settings", () => {
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.OPENAI_TEXT_MODEL;
    delete process.env.OPENAI_IMAGE_MODEL;
    expect(() => getTextModel()).toThrow(AiConfigurationError);
    expect(() => getImageModel()).toThrow(AiConfigurationError);
  });
  it("uses required nullable fields for strict structured output", () => {
    const result = aiMaterialDocumentSchema.safeParse({
      version: 1,
      metadata: { title: "教材", grade: "中2", subject: "数学", unit: "一次関数", objective: "理解する", difficulty: "standard" },
    });
    expect(result.success).toBe(false);
  });
});
