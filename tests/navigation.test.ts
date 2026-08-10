import { describe, expect, it } from "vitest";
import { mobileNavigationByRole, navigationByRole, parseExperienceRole, withExperienceRole } from "../config/navigation";
import { defaultStudentStage, studentExperience } from "../config/student-experience";

describe("experience role navigation", () => {
  it("accepts only the three UI experience roles", () => {
    expect(parseExperienceRole("personal")).toBe("personal");
    expect(parseExperienceRole("student")).toBe("student");
    expect(parseExperienceRole("teacher")).toBe("teacher");
    expect(parseExperienceRole("admin")).toBeNull();
    expect(parseExperienceRole("https://example.com")).toBeNull();
  });

  it("adds a fixed experience query without creating an external redirect", () => {
    expect(withExperienceRole("/materials", "student")).toBe("/materials?from=student");
    expect(withExperienceRole("/materials?view=recent", "teacher")).toBe("/materials?view=recent&from=teacher");
  });

  it("keeps mobile navigation to five items or fewer", () => {
    for (const items of Object.values(mobileNavigationByRole)) expect(items.length).toBeLessThanOrEqual(5);
  });

  it("does not expose unimplemented teacher destinations", () => {
    const labels = navigationByRole.teacher.map(item => item.label);
    expect(labels).toEqual(["ホーム", "教材作成", "教材管理", "設定"]);
  });
});

describe("student experience stages", () => {
  it("starts with the middle-school experience and defines all future stages", () => {
    expect(defaultStudentStage).toBe("middle");
    expect(Object.keys(studentExperience)).toEqual(["elementary", "middle", "high"]);
  });
});
