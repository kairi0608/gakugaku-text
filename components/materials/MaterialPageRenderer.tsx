import type { CSSProperties } from "react";
import type { MaterialDocument } from "@/features/materials/shared/types";
import type { MaterialRenderContext } from "./MaterialRenderer";
import { MaterialBlockRenderer } from "./MaterialBlockRenderer";

export function MaterialPageRenderer({ document, page, context }: { document: MaterialDocument; page: MaterialDocument["pages"][number]; context: MaterialRenderContext }) {
  return <section className={`material-page ${document.presentation.pageSize} ${page.backgroundAssetId ? "has-material-background" : ""}`} style={{ "--accent": document.presentation.colorPalette[0], "--warm": document.presentation.colorPalette[1], backgroundImage: page.backgroundAssetId ? `linear-gradient(rgba(255,255,255,.88),rgba(255,255,255,.88)),url(/api/assets/${page.backgroundAssetId})` : undefined } as CSSProperties}>
    {page.blocks.map(block => <MaterialBlockRenderer key={block.id} block={block} document={document} context={context} />)}
  </section>;
}
