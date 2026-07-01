import { ResumeExtractionResult } from "../types/domain.types.ts";

export interface PDFExtractor {
  extractText(arrayBuffer: ArrayBuffer): Promise<ResumeExtractionResult>;
}
