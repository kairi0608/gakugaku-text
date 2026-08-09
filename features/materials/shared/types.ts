import type { z } from "zod";
import type { materialDocumentSchema } from "./schemas";

export type MaterialDocument = z.infer<typeof materialDocumentSchema>;
export type MaterialBlock = MaterialDocument["pages"][number]["blocks"][number];

