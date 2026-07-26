import { useMemo } from 'react';
import type { RoleMatchResult } from '@/features/taxonomy/types/taxonomy.types';
import type { ReadinessResult } from '../types/readiness.types';
import { readinessService } from '../services/readiness.service';

export interface UseReadinessReturn {
  readiness: ReadinessResult | null;
  isReady: boolean;
}

/**
 * Derives the deterministc readiness score from a validated role match result.
 * This is a pure computation that returns null if prerequisites are absent.
 */
export function useReadiness(matchResult: RoleMatchResult | null | undefined): UseReadinessReturn {
  const readiness = useMemo(() => {
    if (!matchResult) {
      return null;
    }
    return readinessService.calculateReadiness(matchResult);
  }, [matchResult]);

  return {
    readiness,
    isReady: readiness !== null,
  };
}
