import { PageHeader } from "@/components/design-system/PageHeader";
import { CharacterForm } from "./CharacterForm";

export default function NewCharacterPage() {
  return <main className="shell"><PageHeader eyebrow="キャラクター作成" title="新しい学習パートナーを作る" description="好きな色や性格をもとに、学習と一緒に成長するキャラクターを作ります。" /><CharacterForm /></main>;
}
