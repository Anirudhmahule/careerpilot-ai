export type TaxonomyRoleSlug = 'frontend-engineer' | 'react-developer' | 'nextjs-developer';

export interface EvidenceOccurrence {
  rawName: string;
  normalizedSkillId: string | null;
  sourceType: 'skill' | 'experience' | 'project';
  sourceEntityId: string;
  evidence: string[];
  evidenceKind: 'exact' | 'contextual';
}

export interface TaxonomyServiceError {
  message: string;
  code?: string;
}

export interface TaxonomyResult<T = void> {
  data: T | null;
  error: TaxonomyServiceError | null;
}

// Re-export the canonical ResumeAnalysis type for use in taxonomy consumers
export type { ResumeAnalysis as ResumeAnalysisLike } from '../../../lib/resume-analysis.schema.ts';

export type RequirementImportance =
  | "required"
  | "important"
  | "optional";

export interface RoleSkillRequirement {
  skillId: string;
  skillSlug: string;
  canonicalName: string;
  importance: RequirementImportance;
}

export interface MatchedRoleSkill {
  skillId: string;
  skillSlug: string;
  canonicalName: string;
  importance: RequirementImportance;
  occurrences: EvidenceOccurrence[];
}

export interface MissingRoleSkill {
  skillId: string;
  skillSlug: string;
  canonicalName: string;
  importance: RequirementImportance;
}

export interface AdditionalSkill {
  skillId: string;
  skillSlug?: string;
  canonicalName?: string;
  occurrences: EvidenceOccurrence[];
}

export interface RoleMatchResult {
  roleId: string;
  roleName: string;
  roleSlug: string;
  matched: MatchedRoleSkill[];
  missing: MissingRoleSkill[];
  additionalSkills: AdditionalSkill[];
  unmatchedEvidence: EvidenceOccurrence[];
}
