"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction } from "../actions";
import type { PublicSignupRole } from "@/lib/auth/signup-schema";

const roleOptions: Array<{ value: PublicSignupRole; label: string; description: string }> = [
  { value: "personal", label: "個人で利用", description: "自分用教材を作って学ぶ" },
  { value: "student", label: "生徒として利用", description: "先生の課題と自主学習に取り組む" },
  { value: "teacher", label: "教師として利用", description: "教材・クラス・課題を管理する" },
];

function SignupButton() {
  const { pending } = useFormStatus();
  return <button className="button auth-submit" type="submit" disabled={pending}>{pending ? "登録中…" : "アカウントを作成"}</button>;
}

export function SignupForm() {
  const [role, setRole] = useState<PublicSignupRole>("personal");
  return <form action={signupAction} className="auth-form">
    <label className="field"><span className="field-label">表示名</span><input name="displayName" autoComplete="name" maxLength={80} required /></label>
    <label className="field"><span className="field-label">メールアドレス</span><input name="email" type="email" autoComplete="email" required /></label>
    <label className="field"><span className="field-label">パスワード（8文字以上）</span><input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /></label>
    <fieldset className="signup-role-fieldset"><legend>利用方法</legend><div className="signup-role-grid">{roleOptions.map(option => <label className={`signup-role-option ${role === option.value ? "selected" : ""}`} key={option.value}><input name="role" type="radio" value={option.value} checked={role === option.value} onChange={() => setRole(option.value)} /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</div></fieldset>
    {role === "student" && <label className="field"><span className="field-label">学年区分</span><select name="gradeBand" defaultValue="other"><option value="elementary">小学生</option><option value="middle">中学生</option><option value="high">高校生</option><option value="other">その他</option></select></label>}
    <p className="auth-consent">登録すると、<a href="/terms">利用規約</a>と<a href="/privacy">プライバシーポリシー</a>を確認したものとして扱われます。</p>
    <SignupButton />
  </form>;
}
