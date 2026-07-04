/**
 * useGaps
 *
 * Derives the deterministic gap result from a role match result.
 * Pure computation — no network, no persistence, no AI.
 * Returns null when prerequisites are unavailable.
 * Memoized: stale result cannot survive when matchResult becomes null/undefined.
 */

import { useMemo } from 'react';
import type { RoleMatchResult } from '@/features/taxonomy/types/taxonomy.types';
import type { GapResult } from '../types/gap.types';
import { gapService } from '../services/gap.service';

// ─── Public return type ───────────────────────────────────────────────────────

export interface UseGapsReturn {
    /** The computed gap result, or null if matchResult was not provided. */
    gaps: GapResult | null;
    /** True when a valid gap result is available. */
    isReady: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGaps(
    matchResult: RoleMatchResult | null | undefined,
): UseGapsReturn {
    const gaps = useMemo(() => {
        if (!matchResult) return null;
        return gapService.calculateGaps(matchResult);
    }, [matchResult]);

    return {
        gaps,
        isReady: gaps !== null,
    };
}
