"use client";

import { FileOutput, Settings2, SlidersHorizontal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppCard } from "@/components/design-system/AppCard";
import { InterestCards, PresentationCards } from "@/components/learning/PreferenceCards";
import { MaterialGenerationProgress } from "@/components/materials/MaterialGenerationProgress";
import { withExperienceRole, type ExperienceRole } from "@/config/navigation";
import type { InterestCategory, PresentationFamily } from "@/features/learning-session/shared/types";

const selects = {
  difficulty: [["easy", "やさしい"], ["standard", "標準"], ["challenge", "チャレンジ"]],
  format: [["simple", "シンプル"], ["visual-guide", "図解"], ["adventure", "冒険"], ["comic", "漫画"], ["picture-book", "絵本"], ["game-card", "ゲームカード"], ["worksheet-poster", "ワークシートポスター"]],
  textAmount: [["short", "短め"], ["standard", "標準"], ["long", "多め"]],
  imageAmount: [["few", "少なめ"], ["standard", "標準"], ["many", "多め"]],
  answerType: [["text", "記述"], ["number", "数値"], ["choice", "選択"], ["multiple-choice", "複数選択"], ["drawing", "お絵かき"]],
  pageSize: [["screen", "画面"], ["a4-portrait", "A4縦"], ["a4-landscape", "A4横"]],
} as const;

export function CreateForm({ role, initialPresentation = "illustration", initialInterest = "adventure" }: { role: ExperienceRole; initialPresentation?: PresentationFamily; initialInterest?: InterestCategory }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [personalizationMode, setPersonalizationMode] = useState<"none" | "self" | "student">(role === "student" ? "self" : "none");
  const [presentationFamily, setPresentationFamily] = useState<PresentationFamily>(initialPresentation);
  const [interestCategory, setInterestCategory] = useState<InterestCategory>(initialInterest);
  const [students, setStudents] = useState<Array<{ id: string; displayName: string; classroomName: string }>>([]);

  useEffect(() => {
    if (role !== "teacher") return;
    fetch("/api/classrooms/students", { cache: "no-store" })
      .then(response => response.ok ? response.json() : { students: [] })
      .then(value => setStudents(Array.isArray(value.students) ? value.students : []))
      .catch(() => setStudents([]));
  }, [role]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const body: Record<string, unknown> = { ...raw, questionCount: Number(raw.questionCount), useCharacter: raw.useCharacter === "on", personalizationMode, presentationFamily, interestCategory };
    delete body.useLearningHistory;
    if (!body.targetStudentId) delete body.targetStudentId;
    const timer = window.setInterval(() => setStep(value => Math.min(5, value + 1)), 650);
    try {
      const response = await fetch("/api/materials/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "教材を作成できませんでした");
      setStep(6);
      if (role === "teacher") router.push(`/teacher/materials/${result.id}/review`);
      else if (role === "student") router.push(withExperienceRole(`/learn/${result.id}`, role));
      else router.push(withExperienceRole(`/materials/${result.id}`, role));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "教材を作成できませんでした");
      setBusy(false);
    } finally {
      window.clearInterval(timer);
    }
  }

  if (busy) return <AppCard><p className="eyebrow">教材を作成しています</p><h2>内容を確認しながら組み立てています</h2><MaterialGenerationProgress active={step} /></AppCard>;

  return (
    <form onSubmit={submit}>
      <div className="create-layout">
        <AppCard className="form-section">
          <div className="form-section-header"><span><Settings2 aria-hidden="true" size={18} /></span><h2>基本設定</h2></div>
          <div className="form-grid">
            <Field name="grade" label="学年" defaultValue="小学3年" />
            <Field name="subject" label="教科" defaultValue="算数" />
            <Field name="unit" label="単元" defaultValue="わり算" />
            <Select name="difficulty" label="難易度" />
            <Field name="questionCount" label="問題数" defaultValue="4" type="number" min="1" max="12" />
          </div>
        </AppCard>

        <AppCard className="form-section">
          <div className="form-section-header"><span><Sparkles aria-hidden="true" size={18} /></span><h2>個別最適化</h2></div>
          {role === "teacher" ? <>
            <label className="field"><span>利用する履歴</span><select name="personalizationMode" value={personalizationMode} onChange={event => setPersonalizationMode(event.target.value as "none" | "student")}><option value="none">使用しない</option><option value="student">特定の生徒</option></select></label>
            {personalizationMode === "student" && <label className="field"><span>対象の生徒</span><select name="targetStudentId" required defaultValue=""><option value="" disabled>生徒を選択</option>{students.map(student => <option value={student.id} key={student.id}>{student.displayName}（{student.classroomName}）</option>)}</select><small>担当クラスに所属する生徒だけが表示されます。</small></label>}
          </> : <label className="choice"><input name="useLearningHistory" type="checkbox" checked={personalizationMode === "self"} onChange={event => setPersonalizationMode(event.target.checked ? "self" : "none")} /><span><strong>学習履歴を使って問題を調整</strong><span className="row-meta">本人の得点・誤答・教材形式・フィードバックだけを抽象化して使用します。</span></span></label>}
          <p className="caption">履歴がない場合は架空の傾向を作らず、通常の教材を生成します。</p>
        </AppCard>

        <AppCard className="form-section">
          <div className="form-section-header"><span><SlidersHorizontal aria-hidden="true" size={18} /></span><h2>見せ方・回答</h2></div>
          <div className="preference-section"><h3>ビジュアルの方向</h3><PresentationCards value={presentationFamily} onChange={setPresentationFamily} />{presentationFamily === "real" && <p className="caption">AIが生成する場合は「図鑑風の正確な図解」です。実写真としては表示しません。教師が権利確認済みの写真を別途登録できます。</p>}</div>
          <div className="preference-section"><h3>興味のテーマ</h3><InterestCards value={interestCategory} onChange={setInterestCategory} /></div>
          <div className="form-grid">
            <Select name="format" label="教材形式" />
            <Select name="textAmount" label="文章量" />
            <Select name="imageAmount" label="画像量" />
            <Select name="answerType" label="回答形式" />
            <Select name="pageSize" label="出力形式" />
          </div>
        </AppCard>

        <AppCard className="form-section">
          <div className="form-section-header"><span><Sparkles aria-hidden="true" size={18} /></span><h2>内容のリクエスト</h2></div>
          <Area name="request" label="自由な要望" defaultValue="森を探検する冒険形式で、文章は短めにしてください。" help="教材に入れたい雰囲気や説明方法を入力できます。" />
          <Area name="avoid" label="避けたい内容" defaultValue="怖い表現、実在人物、有名キャラクター" help="使ってほしくない表現や題材を入力してください。" />
        </AppCard>

        <AppCard className="form-section">
          <div className="form-section-header"><span><FileOutput aria-hidden="true" size={18} /></span><h2>キャラクター</h2></div>
          <label className="choice"><input name="useCharacter" type="checkbox" /><span><strong>自分のキャラクターを登場させる</strong><span className="row-meta">作成済みの学習パートナーを教材に反映します。</span></span></label>
          <p className="caption">教材は選択した出力形式で保存され、教材画面から印刷できます。</p>
        </AppCard>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="create-action"><p>入力内容は教材生成と保存のために使用されます。</p><button className="button" type="submit"><Sparkles aria-hidden="true" size={18} />{role === "student" ? "練習問題を作る" : "教材を一括生成"}</button></div>
    </form>
  );
}

function Field({ name, label, defaultValue, type = "text", min, max }: { name: string; label: string; defaultValue: string; type?: string; min?: string; max?: string }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={defaultValue} min={min} max={max} required /></label>;
}

function Area({ name, label, defaultValue, help }: { name: string; label: string; defaultValue: string; help: string }) {
  return <label className="field"><span>{label}</span><textarea name={name} defaultValue={defaultValue} /><small>{help}</small></label>;
}

function Select({ name, label }: { name: keyof typeof selects; label: string }) {
  return <label className="field"><span>{label}</span><select name={name}>{selects[name].map(option => <option key={option[0]} value={option[0]}>{option[1]}</option>)}</select></label>;
}
