import { PageHeader } from "@/components/design-system/PageHeader";
import { requireAnyRole } from "@/lib/auth/require-role";
import { interestCategorySchema, presentationFamilySchema } from "@/features/learning-session/shared/schemas";
import { createClient } from "@/lib/supabase/server";
import { CreateForm } from "./CreateForm";

export const dynamic = "force-dynamic";
export default async function CreatePage() {
  const current = await requireAnyRole(["personal", "student", "teacher"]);
  const db = await createClient(); const settings = await db.from("hub_user_settings").select("presentation_family,interest_category").eq("user_id", current.user.id).maybeSingle();
  const student = current.profile.role === "student";
  return <main className="shell"><PageHeader eyebrow={`${current.profile.role === "teacher" ? "教師" : student ? "生徒" : "個人"}ページ・${student ? "自主学習" : "教材作成"}`} title={student ? "自分の練習教材を作る" : "新しい教材を作る"} description="学ぶ内容と見せ方を選ぶと、AIが問題・正答・解説と専用画像を生成して安全に保存します。" />{!process.env.OPENAI_API_KEY && <p className="notice error">AI機能は現在利用できません。管理者がOPENAI_API_KEYを設定する必要があります。</p>}<CreateForm role={current.profile.role} initialPresentation={presentationFamilySchema.catch("illustration").parse(settings.data?.presentation_family)} initialInterest={interestCategorySchema.catch("adventure").parse(settings.data?.interest_category)} /></main>;
}
