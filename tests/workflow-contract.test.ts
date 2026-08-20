import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("UI to API to persistence workflow contracts", () => {
  it("connects material generation, image generation, saving, learning, grading, feedback, and EXP", () => {
    expect(source("../app/create/CreateForm.tsx")).toContain('fetch("/api/materials/generate"');
    const generation = source("../features/material-generation/server/generate-material.ts");
    expect(generation).toContain("generateStructuredText");
    expect(generation).toContain("generateImage");
    expect(generation).toContain("saveVisualAsset");
    expect(generation).toContain("await saveMaterial");
    expect(generation).toContain("if (!saved) throw");
    const learn = source("../app/learn/[id]/LearnForm.tsx");
    expect(learn).toContain('fetch("/api/attempts/submit"');
    expect(learn).toContain("/evaluate");
    const materials = source("../lib/materials.ts");
    expect(materials).toContain('db.rpc("hub_finalize_attempt_exp"');
    const evaluation = source("../app/api/attempts/[id]/evaluate/route.ts");
    expect(evaluation).toContain('db.from("hub_feedback").insert');
    expect(evaluation).toContain("feedback_json: evaluation");
  });

  it("connects teacher classroom, assignment, submission, and review workflows", () => {
    expect(source("../components/workflows/ClassroomForms.tsx")).toContain('requestJson("/api/classrooms"');
    expect(source("../components/workflows/AssignmentForm.tsx")).toContain('requestJson("/api/assignments"');
    expect(source("../app/api/attempts/submit/route.ts")).toContain("hub_assignment_submissions");
    expect(source("../components/workflows/ReviewForm.tsx")).toContain("/api/submissions/${submissionId}/review");
    expect(source("../app/api/submissions/[id]/review/route.ts")).toContain('requireApiRole(["teacher"])');
  });

  it("connects character design, evolution preview, EXP threshold, apply, and image history", () => {
    expect(source("../app/characters/new/CharacterForm.tsx")).toContain('fetch("/api/characters/design"');
    const images = source("../app/api/characters/images/route.ts");
    expect(images).toContain("child: 100");
    expect(images).toContain('"learning-partner": 300');
    expect(images).toContain("is_active: false");
    const evolution = source("../components/characters/EvolutionPanel.tsx");
    expect(evolution).toContain("/evolution/apply");
    expect(evolution).toContain("...assets");
  });

  it("connects AI/upload backgrounds to private storage and persisted appearance", () => {
    expect(source("../components/appearance/AppearanceForm.tsx")).toContain("/api/backgrounds/generate");
    expect(source("../components/appearance/AppearanceForm.tsx")).toContain("/api/backgrounds/upload");
    expect(source("../lib/storage/assets.ts")).toContain(".webp({ quality: 88 })");
    expect(source("../app/api/settings/appearance/route.ts")).toContain("hub_user_settings");
  });
});
