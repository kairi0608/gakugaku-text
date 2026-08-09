"use client";const steps=["学習内容を作成中","問題を確認中","教材デザインを作成中","イラストを生成中","問題を配置中","保存中","完成"];
export function MaterialGenerationProgress({active}:{active:number}){return <ol className="progress">{steps.map((s,i)=><li key={s} className={i<=active?"done":""}>{i<active?"✓":i+1} {s}</li>)}</ol>}

