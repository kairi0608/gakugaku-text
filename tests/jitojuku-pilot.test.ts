import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  adaptiveQuestionSchema,
  dailyMoodSchema,
  feedbackModeSchema,
  learningContextSchema,
  learningSessionCreateSchema,
  materialStatusSchema,
  presentationFamilySchema,
  reviewDecisionSchema,
  whatIfQuestionSchema,
  whatIfTriggerSchema,
} from "../features/learning-session/shared/schemas";
import { createTypicalQuestion } from "../features/learning-session/server/typical-question";

function source(path: string) { return readFileSync(new URL(path, import.meta.url), "utf8"); }
const uuid = "11111111-1111-4111-8111-111111111111";

describe("Jitojuku pilot schemas", () => {
  it("keeps future feedback modes typed but limits the current session UI contract to after-set", () => {
    expect(feedbackModeSchema.parse("after-each")).toBe("after-each");
    expect(learningSessionCreateSchema.safeParse({ mode: "self-practice", subject: "算数", unit: "わり算", feedbackMode: "after-each" }).success).toBe(false);
    expect(learningSessionCreateSchema.safeParse({ mode: "self-practice", subject: "算数", unit: "わり算", feedbackMode: "after-set" }).success).toBe(true);
  });

  it("validates mood, presentation, material status, reviews, and What If triggers", () => {
    for (const mood of ["very-good", "good", "neutral", "tired", "low"]) expect(dailyMoodSchema.safeParse(mood).success).toBe(true);
    for (const family of ["real", "illustration"]) expect(presentationFamilySchema.safeParse(family).success).toBe(true);
    for (const status of ["draft", "reviewing", "approved", "published", "archived"]) expect(materialStatusSchema.safeParse(status).success).toBe(true);
    for (const decision of ["approved", "rejected", "needs_revision"]) expect(reviewDecisionSchema.safeParse(decision).success).toBe(true);
    for (const trigger of ["schedule", "login-streak", "study-time", "completed-problems"]) expect(whatIfTriggerSchema.safeParse(trigger).success).toBe(true);
  });

  it("keeps LearningContext anonymous and mood as non-diagnostic guidance", () => {
    const value = { gradeBand: "middle", recentPerformance: 75, weakPatterns: ["文章題"], strongPatterns: ["計算"], mood: "tired", presentationFamily: "illustration", interestCategory: "space", questionCount: 3, difficulty: "standard", moodGuidance: ["典型問題を優先", "説明を短く"] };
    expect(learningContextSchema.safeParse(value).success).toBe(true);
    expect(learningContextSchema.safeParse({ ...value, email: "student@example.com" }).success).toBe(false);
  });

  it("checks adaptive answer consistency and produces an explicitly marked typical first question", () => {
    expect(adaptiveQuestionSchema.safeParse({ id: uuid, prompt: "6÷2は？", answerType: "choice", choices: [{ id: "a", label: "3" }], correctAnswer: "missing", explanation: "6を2つに分けます", difficulty: "standard", typicalPattern: "等分除", generationSource: "ai" }).success).toBe(false);
    const first = createTypicalQuestion({ subject: "算数", unit: "わり算", difficulty: "standard", order: 1 });
    expect(adaptiveQuestionSchema.parse(first).generationSource).toBe("system-template");
  });

  it("validates an open-ended What If question without a score contract", () => {
    expect(whatIfQuestionSchema.safeParse({ title: "重力のもしも", question: "もし重力が半分なら？", visualBrief: "軽く浮く教室のイラスト", thinkingHints: ["移動を考える"], learningConnections: [{ subject: "理科", concept: "重力" }] }).success).toBe(true);
    expect(whatIfQuestionSchema.safeParse({ title: "", question: "", thinkingHints: [], learningConnections: [], score: 100 }).success).toBe(false);
  });
});

describe("Jitojuku pilot workflow contracts", () => {
  const migration = source("../supabase/migrations/006_jitojuku_pilot.sql");

  it("separates fixed assignments from persisted adaptive questions", () => {
    const create = source("../app/api/learning-sessions/route.ts");
    const next = source("../app/api/learning-sessions/[id]/next-question/route.ts");
    expect(create).toContain('mode: "assigned"');
    expect(create).toContain("materialDocumentSchema.parse");
    expect(next).toContain('session.data.mode !== "self-practice"');
    expect(next).toContain('db.from("hub_session_questions").insert');
    expect(next).toContain("adaptiveQuestionSchema");
    expect(next).toContain("system-fallback");
  });

  it("connects one-question game answers, capped activity time, set feedback, EXP, and history", () => {
    expect(source("../app/student/practice/[id]/SessionGame.tsx")).toContain("問題 {currentNumber} / {session.target}");
    expect(source("../app/api/learning-sessions/[id]/answer/route.ts")).toContain("Math.min(300");
    expect(source("../app/api/learning-sessions/[id]/answer/route.ts")).toContain('db.rpc("hub_record_session_answer"');
    expect(source("../app/api/learning-sessions/[id]/complete/route.ts")).toContain('feature: "set-feedback"');
    expect(source("../app/api/learning-sessions/[id]/complete/route.ts")).toContain('db.rpc("hub_finalize_learning_session"');
    expect(source("../app/history/page.tsx")).toContain('eq("mode", "self-practice")');
  });

  it("requires teacher review and approved-only assignment at API and database layers", () => {
    expect(source("../features/material-generation/server/generate-material.ts")).toContain("await saveMaterial");
    expect(source("../app/create/CreateForm.tsx")).toContain("/review`");
    expect(source("../app/api/materials/[id]/approve/route.ts")).toContain("hub_material_reviews");
    expect(source("../app/api/assignments/route.ts")).toContain('["approved", "published"]');
    expect(migration).toContain("hub_require_approved_assignment_material");
    expect(migration).toContain("v_status not in ('approved','published')");
  });

  it("connects mood and saved visual preferences without blocking normal study", () => {
    expect(source("../components/mood/DailyMoodCheck.tsx")).toContain("あとで");
    expect(source("../app/api/mood/route.ts")).toContain('onConflict: "user_id,local_date"');
    expect(source("../features/learning-session/server/learning-context.ts")).toContain("moodGuidance");
    expect(source("../features/learning-session/server/learning-context.ts")).toContain('eq("mode", "self-practice")');
    expect(source("../app/student/practice/PracticeSetupForm.tsx")).toContain('fetch("/api/preferences"');
    expect(source("../components/learning/PreferenceCards.tsx")).toContain('role="radiogroup"');
  });

  it("distinguishes uploaded photos from generated illustrations in private storage", () => {
    const photo = source("../app/api/photo-assets/route.ts"); const assets = source("../lib/storage/assets.ts");
    expect(photo).toContain('assetSource: "upload"'); expect(photo).toContain('assetKind: "photo"');
    expect(assets).toContain("normalizeUploadedImage"); expect(assets).toContain('.webp({ quality: 88 })'); expect(assets).toContain('storage.from(bucket).upload');
    expect(source("../features/material-generation/server/generate-material.ts")).toContain("not an actual photograph");
  });

  it("connects scheduled and streak What If events to one participation and deduped EXP", () => {
    expect(source("../app/api/teacher/special-events/route.ts")).toContain("whatIfQuestionSchema");
    expect(source("../features/special-events/server/available-event.ts")).toContain('trigger_type === "login-streak"');
    expect(source("../app/api/what-if/[id]/answer/route.ts")).toContain("hub_what_if_participations");
    expect(migration).toContain("unique(event_id, user_id)");
    expect(migration).toContain("'what-if:event:' || p_event_id::text");
  });
});

describe("Jitojuku pilot security and responsive contracts", () => {
  const migration = source("../supabase/migrations/006_jitojuku_pilot.sql"); const css = source("../app/globals.css");
  it("adds owner/classroom RLS to every new personal or classroom table", () => {
    expect(migration).toContain("user_id=auth.uid() or public.hub_is_admin() or public.hub_teacher_can_view_student(user_id)");
    expect(migration).toContain("public.hub_can_access_learning_session(session_id)");
    expect(migration).toContain("m.owner_id=auth.uid()");
    expect(migration).toContain("public.hub_is_classroom_member(classroom_id)");
    expect(migration).not.toMatch(/drop\s+table/i); expect(migration).not.toMatch(/truncate/i);
  });

  it("keeps mobile cards within one-column layouts down to 390/320 widths", () => {
    expect(css).toContain("@media (max-width: 390px)");
    expect(css).toContain(".presentation-choice-grid, .interest-choice-grid { grid-template-columns: 1fr;");
    expect(css).toContain(".teacher-review-layout, .what-if-layout { grid-template-columns: 1fr;");
    expect(css).toContain(".visual-choice { min-width: 0; min-height: 112px;");
  });
});
