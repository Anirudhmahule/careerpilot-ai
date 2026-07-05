import { supabase } from '@/lib/supabase';
/**
 * useTaxonomy
 *
 * Retrieves a completed analysis snapshot for the given resumeVersionId,
 * validates the raw_response through ResumeAnalysisSchema, runs the
 * taxonomy aggregation and resolution pipeline, and returns typed results.
 *
 * ARCHITECTURE BOUNDARY:
 *   raw_response → parseSnapshotRawResponse → ResumeAnalysis
 *   → aggregateEvidenceOccurrences → resolveEvidenceOccurrences
 *   → EvidenceOccurrence[]
 *
 * Follows the repository { data, error } hook pattern.
 * Never mutates the snapshot or its raw_response.
 */

import { useCallback, useEffect, useState } from 'react';
import { analysisService } from '@/features/analysis/services/analysis.service';
import { taxonomyService } from '@/features/taxonomy/services/taxonomy.service';
import { parseSnapshotRawResponse } from '@/lib/resume-analysis.schema';
import type { EvidenceOccurrence, RoleMatchResult, TaxonomyRoleSlug } from '@/features/taxonomy/types/taxonomy.types';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TaxonomyHookError {
  message: string;
  code?: string;
  stage?: 'db' | 'validation' | 'taxonomy' | 'role_match';
}

export interface UseTaxonomyReturn {
  /** All evidence occurrences from the validated snapshot, or null if not ready. */
  occurrences: EvidenceOccurrence[] | null;
  /** The result of role matching, if a roleSlug was provided. */
  matchResult: RoleMatchResult | null;
  /** True while loading or resolving. */
  isLoading: boolean;
  /** Any error from DB, schema validation, taxonomy resolution, or matching. */
  error: TaxonomyHookError | null;
  /** The ID of the snapshot that was used for taxonomy. */
  snapshotId: string | null;
  /** The created_at timestamp of the snapshot used for taxonomy. */
  snapshotCreatedAt: string | null;
  /** Manually trigger a reload. */
  refresh(): Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTaxonomy(resumeVersionId?: string, roleSlug?: TaxonomyRoleSlug): UseTaxonomyReturn {
  const [occurrences, setOccurrences] = useState<EvidenceOccurrence[] | null>(null);
  const [matchResult, setMatchResult] = useState<RoleMatchResult | null>(null);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [snapshotCreatedAt, setSnapshotCreatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TaxonomyHookError | null>(null);

  const load = useCallback(async (versionId: string, currentRoleSlug?: TaxonomyRoleSlug): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setOccurrences(null);
    setMatchResult(null);
    setSnapshotId(null);
    setSnapshotCreatedAt(null);

    // 1. Fetch latest completed snapshot for this resume version
    const { data: snapshot, error: dbError } =
      await analysisService.getLatestSnapshotByResumeVersionId(versionId);

    if (dbError) {
      setError({ message: dbError.message, code: dbError.code, stage: 'db' });
      setIsLoading(false);
      return;
    }

    if (!snapshot || snapshot.status !== 'completed') {
      // No completed snapshot yet — not an error, just not ready
      setIsLoading(false);
      return;
    }

    setSnapshotId(snapshot.id);
    setSnapshotCreatedAt(snapshot.created_at);

    // 2. Validate raw_response through ResumeAnalysisSchema (trust boundary)
    const validationResult = parseSnapshotRawResponse(
      snapshot.raw_response as Record<string, unknown> | null,
    );

    if (!validationResult.success) {
      setError({ message: validationResult.error.message, stage: 'validation' });
      setIsLoading(false);
      return;
    }

    const analysis = validationResult.data;

    // 3. Deterministic aggregation (pure — no DB calls)
    const rawOccurrences = taxonomyService.aggregateEvidenceOccurrences(analysis);

    // 4. Alias resolution (2 batched DB queries max)
    const { data: resolved, error: taxonomyError } =
      await taxonomyService.resolveEvidenceOccurrences(rawOccurrences, supabase);

    if (taxonomyError || !resolved) {
      setError({ message: taxonomyError?.message || 'Resolution failed', code: taxonomyError?.code, stage: 'taxonomy' });
      setIsLoading(false);
      return;
    }

    setOccurrences(resolved);

    // 5. Role Matching (if a role is provided)
    if (currentRoleSlug) {
      const { data: roleReqs, error: roleError } = await taxonomyService.getRoleRequirements(currentRoleSlug, supabase);
      
      if (roleError || !roleReqs) {
        setError({ message: roleError?.message || 'Role requirements failed', code: roleError?.code, stage: 'role_match' });
      } else {
        const match = taxonomyService.matchRoleRequirements(
          roleReqs.roleId,
          roleReqs.roleName,
          roleReqs.roleSlug,
          roleReqs.requirements,
          resolved
        );
        setMatchResult(match);
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!resumeVersionId) {
      setOccurrences(null);
      setMatchResult(null);
      setSnapshotId(null);
      setSnapshotCreatedAt(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void load(resumeVersionId, roleSlug);
  }, [resumeVersionId, roleSlug, load]);

  const refresh = useCallback(async () => {
    if (resumeVersionId) {
      await load(resumeVersionId, roleSlug);
    }
  }, [resumeVersionId, roleSlug, load]);

  return {
    occurrences,
    matchResult,
    snapshotId,
    snapshotCreatedAt,
    isLoading,
    error,
    refresh,
  };
}
