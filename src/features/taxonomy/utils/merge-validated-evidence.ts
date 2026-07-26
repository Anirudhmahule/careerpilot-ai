import type { EvidenceOccurrence } from '../types/taxonomy.types';
import type { ValidationQuestionRow } from '../../validation/types/validation.types';

/**
 * mergeValidatedEvidence
 *
 * Applies completed validation answers to a resolved EvidenceOccurrence[]
 * to produce the corrected input for matchRoleRequirements().
 *
 * Pure. Deterministic. Idempotent. No side effects. No DB calls. No mutations.
 *
 * Rules:
 *   DISCOVER_MISSING_SKILL + boolean_value = true
 *     → Inject a synthetic EvidenceOccurrence for question.skill_id,
 *       BUT ONLY if that skill_id is not already present in resolvedOccurrences.
 *       (Idempotency guarantee: calling merge twice yields the same result.)
 *
 *   CONFIRM_CONTEXTUAL_SKILL + boolean_value = false
 *     → Remove all occurrences with normalizedSkillId === question.skill_id.
 *       (User denied a skill the AI inferred contextually.)
 *
 *   All other combinations → no change (TEXT answers, unanswered questions,
 *   CLARIFY_DEPTH, DISCOVER_MISSING_SKILL with false, etc.)
 *
 * Idempotency contract:
 *   merge(merge(evidence, answers), answers) === merge(evidence, answers)
 */
export function mergeValidatedEvidence(
  resolvedOccurrences: EvidenceOccurrence[],
  questions: ValidationQuestionRow[]
): EvidenceOccurrence[] {
  if (!questions || questions.length === 0) {
    return resolvedOccurrences;
  }

  // 1. Build a Set of all normalizedSkillIds currently in resolvedOccurrences
  // This helps enforce the idempotency guarantee for DISCOVER_MISSING_SKILL.
  const existingSkillIds = new Set<string>();
  for (const occ of resolvedOccurrences) {
    if (occ.normalizedSkillId) {
      existingSkillIds.add(occ.normalizedSkillId);
    }
  }

  // 2. Identify which skills need to be removed (CONFIRM_CONTEXTUAL_SKILL = false)
  const skillIdsToRemove = new Set<string>();
  const syntheticOccurrencesToInject: EvidenceOccurrence[] = [];

  for (const question of questions) {
    // Only process questions with a valid skill_id and at least one answer
    if (!question.skill_id || !question.validation_answers || question.validation_answers.length === 0) {
      continue;
    }

    const answer = question.validation_answers[0]; // RLS ensures this is the user's answer

    if (question.semantic_type === 'DISCOVER_MISSING_SKILL' && answer.boolean_value === true) {
      // User explicitly confirmed a skill the AI missed.
      // Idempotency check: Only inject if it's not already in the evidence set.
      if (!existingSkillIds.has(question.skill_id)) {
        syntheticOccurrencesToInject.push({
          rawName: question.skill_id, // We don't have the canonical name easily available, but skillId is what matters for matching
          normalizedSkillId: question.skill_id,
          sourceType: 'skill',
          sourceEntityId: `validation_${question.id}`,
          evidence: ['User validated this skill through the readiness assessment.'],
          evidenceKind: 'exact',
        });
        // Add to existing set in case multiple questions refer to the same skill
        existingSkillIds.add(question.skill_id);
      }
    } else if (question.semantic_type === 'CONFIRM_CONTEXTUAL_SKILL' && answer.boolean_value === false) {
      // User denied a contextually inferred skill.
      skillIdsToRemove.add(question.skill_id);
    }
  }

  // 3. Filter existing occurrences to remove denied skills
  let mergedOccurrences = resolvedOccurrences;
  
  if (skillIdsToRemove.size > 0) {
    mergedOccurrences = mergedOccurrences.filter(
      (occ) => !occ.normalizedSkillId || !skillIdsToRemove.has(occ.normalizedSkillId)
    );
  }

  // 4. Inject synthetic occurrences
  if (syntheticOccurrencesToInject.length > 0) {
    mergedOccurrences = [...mergedOccurrences, ...syntheticOccurrencesToInject];
  }

  return mergedOccurrences;
}
