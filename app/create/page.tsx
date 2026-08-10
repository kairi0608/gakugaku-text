import { PageHeader } from "@/components/design-system/PageHeader";
import { experienceRoleLabels, parseExperienceRole } from "@/config/navigation";
import { CreateForm } from "./CreateForm";

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ from?: string | string[] }> }) {
  const role = parseExperienceRole((await searchParams).from) ?? "personal";
  const student = role === "student";
  return (
    <main className="shell">
      <PageHeader eyebrow={`${experienceRoleLabels[role]}ページ・${student ? "自主学習" : "教材作成"}`} title={student ? "自分の練習を作る" : "新しい教材を作る"} description="学ぶ内容と見せ方を選ぶと、問題・正答・解説をひとつの教材として保存します。" />
      {!process.env.OPENAI_API_KEY && <p className="notice">AI生成キーが未設定のため、現在は安全な標準教材生成で動作します。</p>}
      <CreateForm role={role} />
    </main>
  );
}
