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

// Minimal type definition for ResumeAnalysis to avoid tight coupling
// with the backend's Zod schemas, while ensuring type safety for aggregation.
export interface ResumeAnalysisLike {
  skills: {
    id: string;
    name: string;
    evidence: string[];
  }[];
  experience: {
    id: string;
    technologies: string[];
    evidence: string[];
  }[];
  projects: {
    id: string;
    technologies: string[];
    evidence: string[];
  }[];
}
