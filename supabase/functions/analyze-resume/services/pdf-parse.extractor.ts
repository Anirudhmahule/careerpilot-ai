import { Buffer } from "node:buffer";
// @deno-types="npm:@types/pdf-parse"
import pdf from "npm:pdf-parse";
import { PDFExtractor } from "./interfaces/pdf-extractor.provider.interface.ts";
import { ResumeExtractionResult } from "../types/resume-analysis.types.ts";

export class PdfParseExtractor implements PDFExtractor {
  async extractText(arrayBuffer: ArrayBuffer): Promise<ResumeExtractionResult> {
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      info: data.info,
      metadata: data.metadata
    };
  }
}
