import { Buffer } from "node:buffer";
import pdf from "npm:pdf-parse@1.1.1";
import { PDFExtractor } from "./interfaces/pdf-extractor.provider.interface.ts";
import { ResumeExtractionResult } from "../types/resume-analysis.types.ts";

export class PdfParseExtractor implements PDFExtractor {
  async extractText(arrayBuffer: ArrayBuffer): Promise<ResumeExtractionResult> {
    const buffer = Buffer.from(arrayBuffer);
    
    // pdf-parse@1.1.1 exports a function directly (CJS) which Deno exposes as default
    const data = await pdf(buffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      info: data.info ?? null,
      metadata: data.metadata ?? null
    };
  }
}
