"use client";

import { FileOutput, Settings2, SlidersHorizontal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppCard } from "@/components/design-system/AppCard";
import { MaterialGenerationProgress } from "@/components/materials/MaterialGenerationProgress";

const selects = {
  difficulty: [["easy", "やさしい"], ["standard", "標準"], ["challenge", "チャレンジ"]],
  format: [["simple", "シンプル"], ["visual-guide", "図解"], ["adventure", "冒険"], ["comic", "漫画"], ["picture-book", "絵本"], ["game-card", "ゲームカード"], ["worksheet-poster", "ワークシートポスター"]],
  textAmount: [["short", "短め"], ["standard", "標準"], ["long", "多め"]],
  imageAmount: [["few", "少なめ"], ["standard", "標準"], ["many", "多め"]],
  answerType: [["text", "記述"], ["number", "数値"], ["choice", "選択"], ["multiple-choice", "複数選択"], ["drawing", "お絵かき"]],
  pageSize: [["screen", "画面"], ["a4-portrait", "A4縦"], ["a4-landscape", "A4横"]],
} as const;

export function CreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const body: Record<string, unknown> = { ...raw, questionCount: Number(raw.questionCount), useCharacter: raw.useCharacter === "on" };
    const timer = window.setInterval(() => setStep(value => Math.min(5, value + 1)), 650);
    try {
      const response = await fetch("/api/materials/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "教材を作成できませんでした");
      setStep(6);
      router.push(`/materials/${result.id}`);
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
          <div className="form-section-header"><span><SlidersHorizontal aria-hidden="true" size={18} /></span><h2>見せ方・回答</h2></div>
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
      <div className="create-action"><p>入力内容は教材生成と保存のために使用されます。</p><button className="button" type="submit"><Sparkles aria-hidden="true" size={18} />教材を一括生成</button></div>
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
