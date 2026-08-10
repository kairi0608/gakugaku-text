import { PageHeader } from "@/components/design-system/PageHeader";
import { CreateForm } from "./CreateForm";

export default function CreatePage() {
  return (
    <main className="shell">
      <PageHeader eyebrow="教材作成" title="新しい教材を作る" description="学ぶ内容と見せ方を選ぶと、問題・正答・解説をひとつの教材として保存します。" />
      {!process.env.OPENAI_API_KEY && <p className="notice">AI生成キーが未設定のため、現在は安全な標準教材生成で動作します。</p>}
      <CreateForm />
    </main>
  );
}
