import type { MaterialDocument } from "@/features/materials/shared/types";import { MaterialBlockRenderer } from "./MaterialBlockRenderer";
export function MaterialPageRenderer({document,page}:{document:MaterialDocument;page:MaterialDocument["pages"][number]}){return <section className={`material-page ${document.presentation.pageSize}`} style={{"--accent":document.presentation.colorPalette[0],"--warm":document.presentation.colorPalette[1]} as React.CSSProperties}>{page.blocks.map(b=><MaterialBlockRenderer key={b.id} block={b} document={document}/>)}</section>}

