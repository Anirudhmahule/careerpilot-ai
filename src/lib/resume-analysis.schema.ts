/**
 * resume-analysis.schema.ts
 *
 * Frontend runtime validation schema for persisted ResumeAnalysis snapshots.
 *
 * ARCHITECTURE BOUNDARY:
 *   This schema is used exclusively by the frontend to validate raw_response
 *   retrieved from analysis_snapshots BEFORE passing data to downstream
 *   services (e.g. taxonomyService). It is the single frontend runtime trust
 *   boundary for persisted JSON.
 *
 * SINGLE SOURCE OF TRUTH STRATEGY:
 *   The Edge Function has its own schema using `npm:zod/v4` (Deno runtime).
 *   The frontend cannot import that file at runtime (Deno-specific specifier).
 *   This file mirrors the Edge Function schema exactly using the standard
 *   `zod/v4` sub-path import. TypeScript enforces structural alignment via
 *   the type-only re-export in resume-analysis.types.ts.
 *
 *   Schema shape changes MUST be applied to BOTH files simultaneously.
 *
 * DO NOT:
 *   - Use this schema to validate AI output directly (that happens in the Edge Function)
 *   - Cast raw_response with `as ResumeAnalysis` instead of parsing
 *   - Add fields that don't exist in the Edge Function schema
 */

import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Leaf schemas
// ---------------------------------------------------------------------------

const AnalysisMetadataSchema = z.object({
  parserVersion: z.string(),
  promptVersion: z.string(),
  language: z.string().nullable(),
});

const PersonalInformationSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  currentTitle: z.string().nullable(),
});

const SummarySchema = z.object({
  text: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Skill
// ---------------------------------------------------------------------------

const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  evidence: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Achievement (nested inside Experience)
// ---------------------------------------------------------------------------

const AchievementSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  evidence: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------

const ExperienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  employmentType: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isCurrent: z.boolean(),
  description: z.string().nullable(),
  responsibilities: z.array(z.string()),
  achievements: z.array(AchievementSchema),
  technologies: z.array(z.string()),
  evidence: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().nullable(),
  description: z.string().nullable(),
  technologies: z.array(z.string()),
  features: z.array(z.string()),
  github: z.string().nullable(),
  liveDemo: z.string().nullable(),
  evidence: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string().nullable(),
  field: z.string().nullable(),
  cgpa: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------

const CertificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string().nullable(),
  issueDate: z.string().nullable(),
  credentialUrl: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Top-level Achievement
// ---------------------------------------------------------------------------

const TopLevelAchievementSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  evidence: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

const LanguageSchema = z.object({
  name: z.string(),
  proficiency: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

const LinksSchema = z.object({
  github: z.string().nullable(),
  linkedin: z.string().nullable(),
  portfolio: z.string().nullable(),
  website: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Supporting schemas
// ---------------------------------------------------------------------------

const MissingInformationSchema = z.object({
  field: z.string(),
  reason: z.string(),
});

const WarningSchema = z.object({
  code: z.string(),
  message: z.string(),
});

// ---------------------------------------------------------------------------
// Database Envelope Schema
// ---------------------------------------------------------------------------

export const AnalysisSnapshotEnvelopeSchema = z.object({
  analysis: z.unknown(), // we defer deep validation to the canonical schema
}).strict();

// ---------------------------------------------------------------------------
// Root domain schema — what gets stored in raw_response
// ---------------------------------------------------------------------------

export const ResumeAnalysisSchema = z.object({
  metadata: AnalysisMetadataSchema,
  personal: PersonalInformationSchema,
  summary: SummarySchema,
  skills: z.array(SkillSchema),
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationSchema),
  certifications: z.array(CertificationSchema),
  achievements: z.array(TopLevelAchievementSchema),
  languages: z.array(LanguageSchema),
  links: LinksSchema,
  missingInformation: z.array(MissingInformationSchema),
  warnings: z.array(WarningSchema),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript type
// ---------------------------------------------------------------------------

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

// ---------------------------------------------------------------------------
// Parse helper — validates raw_response from analysis_snapshots
// ---------------------------------------------------------------------------

export type SnapshotValidationError = {
  message: string;
  issues?: z.core.$ZodIssue[];
};

export type SnapshotValidationResult =
  | { success: true; data: ResumeAnalysis }
  | { success: false; error: SnapshotValidationError };

/**
 * Validate a raw_response value retrieved from an analysis_snapshots row.
 *
 * - null raw_response → explicit error (completed snapshot must have data)
 * - unknown shape → explicit parse error (stale/malformed JSON)
 * - valid shape → typed ResumeAnalysis
 */
export function parseSnapshotRawResponse(
  rawResponse: Record<string, unknown> | null,
): SnapshotValidationResult {
  if (rawResponse === null) {
    return {
      success: false,
      error: { message: "Snapshot raw_response is null - analysis may not have completed." },
    };
  }

  // Handle runtime contract drift: some snapshots have the canonical payload
  // nested under `.analysis`, others might have it at the root.
  const envelopeResult = AnalysisSnapshotEnvelopeSchema.safeParse(rawResponse);
  const canonicalPayload = envelopeResult.success
    ? envelopeResult.data.analysis
    : rawResponse;

  const result = ResumeAnalysisSchema.safeParse(canonicalPayload);

  if (!result.success) {
    return {
      success: false,
      error: {
        message: "We couldn't read this analysis snapshot because its data format is incompatible. Please regenerate the analysis or try again.",
        issues: result.error.issues,
      },
    };
  }

  return { success: true, data: result.data };
}
