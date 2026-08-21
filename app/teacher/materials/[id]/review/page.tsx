import { notFound } from "next/navigation";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { MaterialRenderer } from "@/components/materials/MaterialRenderer";
import { requireRole } from "@/lib/auth/require-role";
import { getMaterial } from "@/lib/materials";
import { PhotoUploadForm } from "./PhotoUploadForm";
import { ReviewActions } from "./ReviewActions";

export const dynamic = "force-dynamic";

export default async function TeacherMaterialReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const current = await requireRole("teacher"); const { id } = await params; const material = await getMaterial(id); if (!material) notFound();
  if (current.profile.role !== "admin" && material.ownerId !== current.user.id) notFound();
  const doc = material.document;
  return <main className="shell teacher-review-page"><PageHeader eyebrow="教師確認" title={material.title} description="AI生成内容を教師が確認し、承認後だけ課題へ配布できます。" /><div className="teacher-review-layout"><section><MaterialRenderer document={doc} /></section><aside><AppCard className="review-information"><h2>教材情報</h2><dl><div><dt>対象</dt><dd>{doc.metadata.grade}</dd></div><div><dt>教科</dt><dd>{doc.metadata.subject}</dd></div><div><dt>単元</dt><dd>{doc.metadata.unit}</dd></div><div><dt>学習目標</dt><dd>{doc.metadata.objective}</dd></div><div><dt>難易度</dt><dd>{doc.metadata.difficulty}</dd></div><div><dt>問題数</dt><dd>{doc.questions.length}問</dd></div><div><dt>Presentation</dt><dd>{doc.presentation.presentationFamily === "real" ? "図鑑・リアル" : "イラスト・アニメ"}</dd></div><div><dt>生成日時</dt><dd>{new Date(material.version.createdAt).toLocaleString("ja-JP")}</dd></div></dl><ReviewActions materialId={id} status={material.status} /></AppCard><AppCard className="section-gap"><PhotoUploadForm /></AppCard></aside></div><section className="review-question-audit section-gap"><h2>問題・正答・解説の確認</h2>{doc.questions.map(question => <AppCard key={question.id}><span className="question-number">問題 {question.order}</span><h3>{question.prompt}</h3><p><strong>正答:</strong> {question.correctAnswer}</p><p><strong>解説:</strong> {question.explanation}</p></AppCard>)}</section></main>;
}
