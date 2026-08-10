import { PageHeader } from "@/components/design-system/PageHeader";
import { requireAnyRole } from "@/lib/auth/require-role";
import { CharacterForm } from "./CharacterForm";

export const dynamic = "force-dynamic";
export default async function NewCharacterPage() {
  const { profile: { role } } = await requireAnyRole(["personal", "student"]);
  return <main className="shell"><PageHeader eyebrow="キャラクター作成" title="新しい学習パートナーを作る" description="デザインと最初のタマゴ画像をAIが生成し、あなた専用のStorageへ保存します。" /><CharacterForm role={role} /></main>;
}
