/**
 * resume-extraction.schema.ts
 *
 * Zod schema for the raw AI extraction output AND the application domain types.
 *
 * ARCHITECTURE CONTRACT:
 *   - `ResumeExtractionSchema` describes what the AI produces: facts only, no IDs.
 *   - Domain schemas (Skill, Experience, etc.) extend extraction schemas by adding
 *     an `id: z.string()` field. These are what get stored and returned to clients.
 *   - Zod is the single source of truth for both validation and TypeScript types.
 *     Hand-written interfaces are NOT used — all types are derived via z.infer<>.
 *   - IDs are NOT present in extraction schemas. They are stamped by the application
 *     after validation.
 */

import { z } from "npm:zod/v4";

// ---------------------------------------------------------------------------
// Leaf extraction schemas (no IDs — what the AI produces)
// ---------------------------------------------------------------------------

export const AnalysisMetadataSchema = z.object({
  parserVersion: z.string(),
  promptVersion: z.string(),
  language: z.string().nullable(),
});

export const PersonalInformationSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  currentTitle: z.string().nullable(),
});

export const SummarySchema = z.object({
  text: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Skill
// ---------------------------------------------------------------------------

export const ExtractedSkillSchema = z.object({
  name: z.string(),
  evidence: z.array(z.string()),
});

// Domain Skill: extraction fields + id stamped by the application
export const SkillSchema = ExtractedSkillSchema.extend({
  id: z.string(),
});

// ---------------------------------------------------------------------------
// Achievement (nested inside Experience)
// ---------------------------------------------------------------------------

export const ExtractedAchievementSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  evidence: z.array(z.string()),
});

export const AchievementSchema = ExtractedAchievementSchema.extend({
  id: z.string(),
});

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------

export const ExtractedExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  employmentType: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isCurrent: z.boolean(),
  description: z.string().nullable(),
  responsibilities: z.array(z.string()),
  achievements: z.array(ExtractedAchievementSchema),
  technologies: z.array(z.string()),
  evidence: z.array(z.string()),
});

export const ExperienceSchema = ExtractedExperienceSchema.extend({
  id: z.string(),
  achievements: z.array(AchievementSchema),
});

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export const ExtractedProjectSchema = z.object({
  name: z.string(),
  role: z.string().nullable(),
  description: z.string().nullable(),
  technologies: z.array(z.string()),
  features: z.array(z.string()),
  github: z.string().nullable(),
  liveDemo: z.string().nullable(),
  evidence: z.array(z.string()),
});

export const ProjectSchema = ExtractedProjectSchema.extend({
  id: z.string(),
});

// ---------------------------------------------------------------------------
// Education (no id — Education entries are identified by institution)
// ---------------------------------------------------------------------------

export const EducationSchema = z.object({
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

export const ExtractedCertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().nullable(),
  issueDate: z.string().nullable(),
  credentialUrl: z.string().nullable(),
});

export const CertificationSchema = ExtractedCertificationSchema.extend({
  id: z.string(),
});

// ---------------------------------------------------------------------------
// Top-level Achievement
// ---------------------------------------------------------------------------

export const ExtractedTopLevelAchievementSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  evidence: z.array(z.string()),
});

export const TopLevelAchievementSchema = ExtractedTopLevelAchievementSchema.extend({
  id: z.string(),
});

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

export const LanguageSchema = z.object({
  name: z.string(),
  proficiency: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export const LinksSchema = z.object({
  github: z.string().nullable(),
  linkedin: z.string().nullable(),
  portfolio: z.string().nullable(),
  website: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// MissingInformation
// ---------------------------------------------------------------------------

export const MissingInformationSchema = z.object({
  field: z.string(),
  reason: z.string(),
});

// ---------------------------------------------------------------------------
// Warning
// ---------------------------------------------------------------------------

export const WarningSchema = z.object({
  code: z.string(),
  message: z.string(),
});

// ---------------------------------------------------------------------------
// Root extraction schema — what the AI returns (no IDs anywhere)
// ---------------------------------------------------------------------------

export const ResumeExtractionSchema = z.object({
  metadata: AnalysisMetadataSchema,
  personal: PersonalInformationSchema,
  summary: SummarySchema,
  skills: z.array(ExtractedSkillSchema),
  experience: z.array(ExtractedExperienceSchema),
  projects: z.array(ExtractedProjectSchema),
  education: z.array(EducationSchema),
  certifications: z.array(ExtractedCertificationSchema),
  achievements: z.array(ExtractedTopLevelAchievementSchema),
  languages: z.array(LanguageSchema),
  links: LinksSchema,
  missingInformation: z.array(MissingInformationSchema),
  warnings: z.array(WarningSchema),
});

// ---------------------------------------------------------------------------
// Root domain schema — what gets stored and returned (IDs stamped by app)
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
// Inferred TypeScript types — Zod is the single source of truth.
// Never write these by hand; always derive them here.
// ---------------------------------------------------------------------------

export type ResumeExtraction = z.infer<typeof ResumeExtractionSchema>;
export type ResumeAnalysis   = z.infer<typeof ResumeAnalysisSchema>;

export type Skill              = z.infer<typeof SkillSchema>;
export type Achievement        = z.infer<typeof AchievementSchema>;
export type Experience         = z.infer<typeof ExperienceSchema>;
export type Project            = z.infer<typeof ProjectSchema>;
export type Education          = z.infer<typeof EducationSchema>;
export type Certification      = z.infer<typeof CertificationSchema>;
export type Language           = z.infer<typeof LanguageSchema>;
export type Links              = z.infer<typeof LinksSchema>;
export type MissingInformation = z.infer<typeof MissingInformationSchema>;
export type Warning            = z.infer<typeof WarningSchema>;
export type AnalysisMetadata   = z.infer<typeof AnalysisMetadataSchema>;
export type PersonalInformation = z.infer<typeof PersonalInformationSchema>;
export type Summary            = z.infer<typeof SummarySchema>;
