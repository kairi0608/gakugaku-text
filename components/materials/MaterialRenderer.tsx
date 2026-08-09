import type { MaterialDocument } from "@/features/materials/shared/types";import { MaterialPageRenderer } from "./MaterialPageRenderer";
export function MaterialRenderer({document,mode="screen"}:{document:MaterialDocument;mode?:"screen"|"print"}){return <div className={`material-renderer ${mode}`}>{document.pages.map(p=><MaterialPageRenderer key={p.id} page={p} document={document}/>)}</div>}

