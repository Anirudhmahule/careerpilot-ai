import type { RoleMatchResult, RequirementImportance, MatchedRoleSkill } from '@/features/taxonomy/types/taxonomy.types';
import type { ReadinessResult, ReadinessBand } from '../types/readiness.types';

export class ReadinessService {
  /**
   * Calculates a deterministic readiness score based on a validated role match result.
   * This is a pure function. It relies entirely on the output of the taxonomy matching phase.
   * No AI calls, no network requests, no state mutations.
   */
  calculateReadiness(matchResult: RoleMatchResult): ReadinessResult {
    const WEIGHTS: Record<RequirementImportance, number> = {
      required: 3,
      important: 2,
      optional: 1,
    };

    // 1. Calculate Coverage
    let totalRequirementWeight = 0;
    let matchedRequirementWeight = 0;

    let totalRequiredCount = 0;
    let matchedRequiredCount = 0;
    let totalImportantCount = 0;
    let matchedImportantCount = 0;
    let totalOptionalCount = 0;
    let matchedOptionalCount = 0;

    const missingRequiredSkillIds: string[] = [];
    const missingImportantSkillIds: string[] = [];

    // Process matched requirements
    for (const match of matchResult.matched) {
      const weight = WEIGHTS[match.importance];
      totalRequirementWeight += weight;
      matchedRequirementWeight += weight;

      if (match.importance === 'required') {
        totalRequiredCount++;
        matchedRequiredCount++;
      } else if (match.importance === 'important') {
        totalImportantCount++;
        matchedImportantCount++;
      } else if (match.importance === 'optional') {
        totalOptionalCount++;
        matchedOptionalCount++;
      }
    }

    // Process missing requirements
    for (const miss of matchResult.missing) {
      const weight = WEIGHTS[miss.importance];
      totalRequirementWeight += weight;

      if (miss.importance === 'required') {
        totalRequiredCount++;
        missingRequiredSkillIds.push(miss.skillId);
      } else if (miss.importance === 'important') {
        totalImportantCount++;
        missingImportantSkillIds.push(miss.skillId);
      } else if (miss.importance === 'optional') {
        totalOptionalCount++;
      }
    }

    const requirementCoverageRaw = totalRequirementWeight > 0 
      ? matchedRequirementWeight / totalRequirementWeight 
      : 0;

    // 2. Calculate Evidence Strength
    let totalMatchedWeightForEvidence = 0;
    let accumulatedEvidenceStrength = 0;

    let exactEvidenceCount = 0;
    let contextualEvidenceCount = 0;

    for (const match of matchResult.matched) {
      const weight = WEIGHTS[match.importance];
      totalMatchedWeightForEvidence += weight;

      let hasExact = false;
      let hasContextual = false;

      for (const occ of match.occurrences) {
        if (occ.evidenceKind === 'exact') {
          hasExact = true;
          exactEvidenceCount++;
        } else if (occ.evidenceKind === 'contextual') {
          hasContextual = true;
          contextualEvidenceCount++;
        }
      }

      let provenanceStrength = 0.0;
      if (hasExact) {
        provenanceStrength = 1.0;
      } else if (hasContextual) {
        provenanceStrength = 0.7;
      }

      accumulatedEvidenceStrength += (weight * provenanceStrength);
    }

    const evidenceStrengthRaw = totalMatchedWeightForEvidence > 0
      ? accumulatedEvidenceStrength / totalMatchedWeightForEvidence
      : 0;

    // 3. Overall Readiness (75% coverage, 25% strength)
    let overallRaw = (requirementCoverageRaw * 0.75) + (evidenceStrengthRaw * 0.25);
    let overallScore = Math.round(overallRaw * 100);

    // 4. Ceiling Rules
    const missingRequiredCount = totalRequiredCount - matchedRequiredCount;
    if (totalRequiredCount > 0) {
      if (missingRequiredCount === totalRequiredCount) {
        overallScore = Math.min(overallScore, 39);
      } else if (missingRequiredCount >= totalRequiredCount / 2) {
        overallScore = Math.min(overallScore, 59);
      } else if (missingRequiredCount > 0) {
        overallScore = Math.min(overallScore, 79);
      }
    }

    // 5. Band Resolution
    let band: ReadinessBand = 'early';
    if (overallScore >= 80) band = 'strong';
    else if (overallScore >= 60) band = 'competitive';
    else if (overallScore >= 40) band = 'developing';

    const requirementCoverageScore = Math.round(requirementCoverageRaw * 100);
    const evidenceStrengthScore = Math.round(evidenceStrengthRaw * 100);

    return {
      roleId: matchResult.roleId,
      roleSlug: matchResult.roleSlug,
      overallScore,
      band,
      requirementCoverage: {
        score: requirementCoverageScore,
        explanation: `${matchedRequirementWeight} of ${totalRequirementWeight} weighted requirement points covered.`,
      },
      evidenceStrength: {
        score: evidenceStrengthScore,
        explanation: `Evidence quality across matched requirements.`,
      },
      matchedRequirementCount: matchResult.matched.length,
      totalRequirementCount: matchResult.matched.length + matchResult.missing.length,
      matchedRequiredCount,
      totalRequiredCount,
      matchedImportantCount,
      totalImportantCount,
      matchedOptionalCount,
      totalOptionalCount,
      exactEvidenceCount,
      contextualEvidenceCount,
      missingRequiredSkillIds,
      missingImportantSkillIds,
      explanation: `Overall score is based on 75% requirement coverage and 25% evidence strength, capped by missing critical requirements.`,
    };
  }
}

export const readinessService = new ReadinessService();
