/**
 * GapService
 *
 * Pure deterministic gap engine. No Supabase. No AI. No React.
 * Same input always produces deeply equal output.
 *
 * Sources of gaps: RoleMatchResult.missing ONLY.
 * Matched skills, additional skills, and unmatched evidence are never gaps.
 *
 * Priority formula (v1):
 *   required  → priorityScore 3 → high
 *   important → priorityScore 2 → medium
 *   optional  → priorityScore 1 → low
 *
 * Sort order: high → medium → low, stable tie-break by canonicalName ascending.
 */

import type { RoleMatchResult } from '@/features/taxonomy/types/taxonomy.types';
import type { GapResult, GapPriority, GapSummary, SkillGap } from '../types/gap.types';

// ─── Service interface ────────────────────────────────────────────────────────

export interface IGapService {
    /**
     * Derive all role gaps from the given match result.
     * Pure function. Does not mutate its input.
     */
    calculateGaps(matchResult: RoleMatchResult): GapResult;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_SCORE: Record<string, number> = {
    required: 3,
    important: 2,
    optional: 1,
} as const;

const PRIORITY_BAND: Record<number, GapPriority> = {
    3: 'high',
    2: 'medium',
    1: 'low',
} as const;

/**
 * Deterministic reason strings keyed by importance.
 * Template-only — no candidate assessment, no AI judgment.
 */
const REASON: Record<string, string> = {
    required: 'Required for the target role and not supported by current resume evidence.',
    important: 'Important for the target role and not supported by current resume evidence.',
    optional: 'Optional for the target role and not supported by current resume evidence.',
} as const;

// ─── Implementation ───────────────────────────────────────────────────────────

class GapService implements IGapService {
    calculateGaps(matchResult: RoleMatchResult): GapResult {
        // Build gaps from missing role requirements only.
        // De-duplicate by skillId in case upstream ever produces duplicates
        // (the current RoleMatchResult contract does not, but we defend against it).
        const seenSkillIds = new Set<string>();
        const rawGaps: SkillGap[] = [];

        for (const miss of matchResult.missing) {
            if (seenSkillIds.has(miss.skillId)) {
                continue; // skip duplicate canonical requirement
            }
            seenSkillIds.add(miss.skillId);

            const score = PRIORITY_SCORE[miss.importance] ?? 1;
            const priority: GapPriority = PRIORITY_BAND[score] ?? 'low';
            const reason = REASON[miss.importance] ?? REASON['optional'];

            rawGaps.push({
                skillId: miss.skillId,
                skillSlug: miss.skillSlug,
                canonicalName: miss.canonicalName,
                importance: miss.importance,
                priority,
                priorityScore: score,
                reason,
            });
        }

        // Sort: descending priorityScore, then canonicalName ascending (stable, deterministic).
        // We sort a copy — matchResult.missing is never mutated.
        const gaps = [...rawGaps].sort((a, b) => {
            if (b.priorityScore !== a.priorityScore) {
                return b.priorityScore - a.priorityScore;
            }
            return a.canonicalName.localeCompare(b.canonicalName);
        });

        // Summary counts
        let highPriorityCount = 0;
        let mediumPriorityCount = 0;
        let lowPriorityCount = 0;
        let missingRequiredCount = 0;
        let missingImportantCount = 0;
        let missingOptionalCount = 0;

        for (const gap of gaps) {
            if (gap.priority === 'high') highPriorityCount++;
            else if (gap.priority === 'medium') mediumPriorityCount++;
            else lowPriorityCount++;

            if (gap.importance === 'required') missingRequiredCount++;
            else if (gap.importance === 'important') missingImportantCount++;
            else missingOptionalCount++;
        }

        const summary: GapSummary = {
            totalGapCount: gaps.length,
            highPriorityCount,
            mediumPriorityCount,
            lowPriorityCount,
            missingRequiredCount,
            missingImportantCount,
            missingOptionalCount,
        };

        return {
            roleId: matchResult.roleId,
            roleSlug: matchResult.roleSlug,
            gaps,
            summary,
        };
    }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const gapService: IGapService = new GapService();
