export type ReadinessBand =
  | "early"
  | "developing"
  | "competitive"
  | "strong";

export type ReadinessComponent = {
  score: number;
  explanation: string;
};

export type ReadinessResult = {
  roleId: string;
  roleSlug: string;
  overallScore: number;
  band: ReadinessBand;

  requirementCoverage: ReadinessComponent;
  evidenceStrength: ReadinessComponent;

  matchedRequirementCount: number;
  totalRequirementCount: number;

  matchedRequiredCount: number;
  totalRequiredCount: number;

  matchedImportantCount: number;
  totalImportantCount: number;

  matchedOptionalCount: number;
  totalOptionalCount: number;

  exactEvidenceCount: number;
  contextualEvidenceCount: number;

  missingRequiredSkillIds: string[];
  missingImportantSkillIds: string[];

  explanation: string;
};
