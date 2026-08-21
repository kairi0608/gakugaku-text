"use client";

import type { InterestCategory, PresentationFamily } from "@/features/learning-session/shared/types";

export const interests: Array<{ value: InterestCategory; label: string; visual: string }> = [
  { value: "animals", label: "動物", visual: "🦊" }, { value: "space", label: "宇宙", visual: "🪐" }, { value: "sports", label: "スポーツ", visual: "⚽" },
  { value: "vehicles", label: "乗り物", visual: "🚄" }, { value: "nature", label: "自然", visual: "🌿" }, { value: "adventure", label: "冒険", visual: "🧭" },
];

export function PresentationCards({ value, onChange }: { value: PresentationFamily; onChange: (value: PresentationFamily) => void }) {
  return <div className="visual-choice-grid presentation-choice-grid" role="radiogroup" aria-label="教材の見せ方">
    <button type="button" role="radio" aria-checked={value === "real"} className={value === "real" ? "visual-choice selected" : "visual-choice"} onClick={() => onChange("real")}><span className="selection-visual real-visual" aria-hidden="true">🔎</span><strong>図鑑・リアル</strong><small>実物の特徴や正確な図解を中心に表示</small></button>
    <button type="button" role="radio" aria-checked={value === "illustration"} className={value === "illustration" ? "visual-choice selected" : "visual-choice"} onClick={() => onChange("illustration")}><span className="selection-visual illustration-visual" aria-hidden="true">🎨</span><strong>イラスト・アニメ</strong><small>キャラクターや冒険の世界観で表示</small></button>
  </div>;
}

export function InterestCards({ value, onChange }: { value: InterestCategory; onChange: (value: InterestCategory) => void }) {
  return <div className="visual-choice-grid interest-choice-grid" role="radiogroup" aria-label="興味カテゴリ">{interests.map(item => <button type="button" role="radio" aria-checked={value === item.value} className={value === item.value ? "visual-choice selected" : "visual-choice"} key={item.value} onClick={() => onChange(item.value)}><span className="selection-visual" aria-hidden="true">{item.visual}</span><strong>{item.label}</strong></button>)}</div>;
}
