/**
 * gap.types.ts
 *
 * Gap Engine contract types.
 *
 * A gap is a canonical target-role requirement that exists in
 * RoleMatchResult.missing — nothing more, nothing less.
 *
 * Priority is derived deterministically from RequirementImportance:
 *   required  → high   (priorityScore 3)
 *   important → medium (priorityScore 2)
 *   optional  → low    (priorityScore 1)
 *
 * No AI, no persistence, no estimation, no roadmap fields.
 */

import type { RequirementImportance } from '@/features/taxonomy/types/taxonomy.types';

// ─── Priority ─────────────────────────────────────────────────────────────────

export type GapPriority = 'high' | 'medium' | 'low';

// ─── Skill gap ────────────────────────────────────────────────────────────────

export interface SkillGap {
    /** Canonical skill ID from the taxonomy. Never rendered as a user-facing label. */
    readonly skillId: string;
    /** Stable taxonomy slug for deterministic semantic identifiers. */
    readonly skillSlug: string;
    /** Canonical display name from the role requirement. Use this for rendering. */
    readonly canonicalName: string;
    /** Requirement importance inherited from the role matrix. */
    readonly importance: RequirementImportance;
    /** Deterministic priority band derived from importance. */
    readonly priority: GapPriority;
    /**
     * Deterministic numeric score:
     *   required = 3 | important = 2 | optional = 1
     * Used for sort ordering. Not an invented weight.
     */
    readonly priorityScore: number;
    /** Human-readable deterministic reason based solely on importance. */
    readonly reason: string;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface GapSummary {
    readonly totalGapCount: number;
    readonly highPriorityCount: number;
    readonly mediumPriorityCount: number;
    readonly lowPriorityCount: number;
    readonly missingRequiredCount: number;
    readonly missingImportantCount: number;
    readonly missingOptionalCount: number;
}

// ─── Result ───────────────────────────────────────────────────────────────────

export interface GapResult {
    readonly roleId: string;
    readonly roleSlug: string;
    /** Gaps sorted: high → medium → low, then by canonicalName within each band. */
    readonly gaps: readonly SkillGap[];
    readonly summary: GapSummary;
}
