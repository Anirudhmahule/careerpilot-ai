import { ResumeExtractionResult } from "../../types/resume-analysis.types.ts";

export interface PDFExtractor {
  extractText(arrayBuffer: ArrayBuffer): Promise<ResumeExtractionResult>;
}
