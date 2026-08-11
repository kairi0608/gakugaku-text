import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const landing = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const roleNavigation = readFileSync(new URL("../components/navigation/RoleNavigation.tsx", import.meta.url), "utf8");

describe("responsive Japanese typography", () => {
  it("uses natural wrapping without a fixed landing line break", () => {
    expect(css).toContain("line-break: strict");
    expect(css).toContain("word-break: normal");
    expect(css).toContain("text-wrap: balance");
    expect(css).toContain("text-wrap: pretty");
    expect(landing).not.toMatch(/<br\s*\/?\s*>/i);
    expect(landing).toContain('className="no-break">学習体験');
  });

  it("lets long button text wrap instead of clipping or shrinking it", () => {
    const buttonRule = css.match(/\.button\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(buttonRule).toContain("max-width: 100%");
    expect(buttonRule).toContain("min-width: 0");
    expect(buttonRule).toContain("min-height: 44px");
    expect(buttonRule).toContain("height: auto");
    expect(buttonRule).toContain("white-space: normal");
    expect(buttonRule).toContain("overflow-wrap: anywhere");
  });

  it("keeps mobile labels readable without ellipsis", () => {
    const mobileLabelRule = css.match(/\.mobile-bottom-nav \.nav-link span\s*\{[^}]+\}/)?.[0] ?? "";
    expect(mobileLabelRule).toContain("white-space: normal");
    expect(mobileLabelRule).toContain("text-overflow: clip");
    expect(mobileLabelRule).not.toContain("ellipsis");
    expect(css).toContain("font-size: 11px");
    expect(css).toContain("min-height: 62px");
  });

  it("uses three, two, and one column landing layouts", () => {
    expect(css).toContain(".landing-roles { grid-template-columns: repeat(3,minmax(0,1fr))");
    expect(css).toContain(".landing-roles { grid-template-columns: repeat(2,minmax(0,1fr))");
    expect(css).toContain(".landing-roles, .signup-role-grid { grid-template-columns: 1fr");
  });

  it("wraps forms, diagnostics, and table values", () => {
    expect(css).toContain('input:not([type="radio"]):not([type="checkbox"]), select, textarea { width: 100%; }');
    expect(css).toContain(".diagnostic-value { max-width: min(100%, 580px); overflow-wrap: anywhere");
    expect(css).toContain(".simple-table-row small { display: block; max-width: 100%; color: var(--text-muted); overflow-wrap: anywhere; }");
  });

  it("removes technical role wording from the user navigation", () => {
    expect(roleNavigation).not.toContain("認証済みロール");
  });
});
