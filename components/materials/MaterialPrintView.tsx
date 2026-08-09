import type { MaterialDocument } from "@/features/materials/shared/types";import { MaterialRenderer } from "./MaterialRenderer";
export function MaterialPrintView({document}:{document:MaterialDocument}){return <div className="print-view"><MaterialRenderer document={document} mode="print"/></div>}

