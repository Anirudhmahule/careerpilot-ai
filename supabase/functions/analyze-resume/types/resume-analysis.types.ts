/**
 * resume-analysis.types.ts
 *
 * TWO-PHASE TYPE CONTRACT:
 *
 *   Phase 1 — AI Extraction
 *     The AI produces a `ResumeExtraction` object validated by
 *     `ResumeExtractionSchema` (Zod). No IDs, no normalizedName,
 *     no confidence scores. Facts only.
 *
 *   Phase 2 — Application Domain
 *     After validation the orchestrator stamps IDs (crypto.randomUUID())
 *     and produces a `ResumeAnalysis` object. This is what gets stored
 *     and returned to clients.
 *
 * ALL domain types are derived from Zod schemas via z.infer.
 * Do NOT write TypeScript interfaces by hand for anything the AI produces
 * or the application stores — define the shape in the Zod schema instead.
 *
 * Never pass raw AI output beyond the validation boundary.
 */

// ---------------------------------------------------------------------------
// Re-export all domain and extraction types from the single source of truth.
// ---------------------------------------------------------------------------

export type {
  ResumeExtraction,
  ResumeAnalysis,
  Skill,
  Achievement,
  Experience,
  Project,
  Education,
  Certification,
  Language,
  Links,
  MissingInformation,
  Warning,
  AnalysisMetadata,
  PersonalInformation,
  Summary,
} from "../validators/resume-extraction.schema.ts";

// ---------------------------------------------------------------------------
// Infrastructure types — not AI-related, hand-written here is correct.
// ---------------------------------------------------------------------------

export type SnapshotStatus = "pending" | "processing" | "completed" | "failed";

export interface AnalyzeResumeCommand {
  analysisSnapshotId: string;
  storagePath: string;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface ResumeExtractionResult {
  text: string;
  pageCount: number;
  info: PdfMetadata | null;
  metadata: Record<string, unknown> | null;
}

export interface AnalyzeResumeResponse {
  analysis: import("../validators/resume-extraction.schema.ts").ResumeAnalysis;
}
