"use client";

import { Printer } from "lucide-react";
import { useState } from "react";
import type { MaterialDocument } from "@/features/materials/shared/types";
import { MaterialPrintView } from "./MaterialPrintView";
import type { PrintContent } from "./MaterialRenderer";

export function PrintWorkspace({ document }: { document: MaterialDocument }) {
  const [content, setContent] = useState<PrintContent>("answer-fields");
  const [orientation, setOrientation] = useState<"a4-portrait" | "a4-landscape">(document.presentation.pageSize === "a4-landscape" ? "a4-landscape" : "a4-portrait");
  return <main className={`print-workspace ${orientation}`}>
    <div className="print-toolbar no-print">
      <label>出力内容<select value={content} onChange={event => setContent(event.target.value as PrintContent)}><option value="questions">問題のみ</option><option value="answer-fields">回答欄付き</option><option value="answers">解答付き</option><option value="solutions">解答・解説付き</option></select></label>
      <label>用紙<select value={orientation} onChange={event => setOrientation(event.target.value as "a4-portrait" | "a4-landscape")}><option value="a4-portrait">A4縦</option><option value="a4-landscape">A4横</option></select></label>
      <button className="button" type="button" onClick={() => window.print()}><Printer aria-hidden="true" size={18} />PDF保存 / 印刷</button>
    </div>
    <p className="print-help no-print">印刷画面の送信先で「PDFに保存」を選ぶとPDFファイルとして保存できます。</p>
    <MaterialPrintView document={document} content={content} orientation={orientation} />
  </main>;
}
