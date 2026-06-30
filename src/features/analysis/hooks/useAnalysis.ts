import { useCallback, useEffect, useRef, useState } from 'react';
import { analysisService } from '../services/analysis.service';
import type { AnalysisServiceError } from '../services/analysis.service';
import type { 
    AnalysisSnapshot, 
    CreateAnalysisSnapshotRequest, 
    UpdateAnalysisSnapshotRequest 
} from '../types/analysis.types';

// ─── Public hook return type ──────────────────────────────────────────────────

export type AnalysisHookError = AnalysisServiceError;

export interface UseAnalysisReturn {
    /** The most recent analysis snapshot for the tracked resume version, or null if none exists. */
    latestSnapshot: AnalysisSnapshot | null;
    /** All analysis snapshots for the tracked resume version, newest first. */
    snapshots: AnalysisSnapshot[];
    /** True while the initial load or any action is in-flight. */
    isLoading: boolean;
    /** The last error from a load or action, or null if everything is fine. */
    error: AnalysisHookError | null;
    /**
     * Create a new analysis snapshot.
     * Automatically triggers a state refresh on success.
     * Returns an error on failure, null on success.
     */
    createSnapshot(request: CreateAnalysisSnapshotRequest): Promise<AnalysisHookError | null>;
    /**
     * Update an existing analysis snapshot.
     * Automatically triggers a state refresh on success.
     * Returns an error on failure, null on success.
     */
    updateSnapshot(id: string, request: UpdateAnalysisSnapshotRequest): Promise<AnalysisHookError | null>;
    /** Manually re-fetch all analysis snapshots for the tracked resume version. */
    refreshSnapshots(): Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalysis(resumeVersionId?: string): UseAnalysisReturn {
    const [latestSnapshot, setLatestSnapshot] = useState<AnalysisSnapshot | null>(null);
    const [snapshots, setSnapshots] = useState<AnalysisSnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<AnalysisHookError | null>(null);

    // mountedRef guards imperative action callbacks that can't rely on a
    // per-effect cancelled flag (same pattern as useResume).
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // ─── Load ────────────────────────────────────────────────────────────────────

    const loadSnapshots = useCallback(async (versionId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        const [latestResult, allResult] = await Promise.all([
            analysisService.getLatestSnapshotByResumeVersionId(versionId),
            analysisService.getAllSnapshotsByResumeVersionId(versionId),
        ]);

        if (!mountedRef.current) return;

        if (latestResult.error) {
            setError(latestResult.error);
            setIsLoading(false);
            return;
        }

        if (allResult.error) {
            setError(allResult.error);
            setIsLoading(false);
            return;
        }

        setLatestSnapshot(latestResult.data);
        setSnapshots(allResult.data ?? []);
        setIsLoading(false);
    }, []);

    // Auto-load when the tracked resumeVersionId changes.
    useEffect(() => {
        if (!resumeVersionId) {
            setLatestSnapshot(null);
            setSnapshots([]);
            setIsLoading(false);
            return;
        }

        void loadSnapshots(resumeVersionId);
    }, [resumeVersionId, loadSnapshots]);

    // ─── Actions ─────────────────────────────────────────────────────────────────

    const createSnapshot = useCallback(
        async (request: CreateAnalysisSnapshotRequest): Promise<AnalysisHookError | null> => {
            setIsLoading(true);
            setError(null);

            const { error: serviceError } = await analysisService.createSnapshot(request);

            if (!mountedRef.current) return null;

            if (serviceError) {
                setError(serviceError);
                setIsLoading(false);
                return serviceError;
            }

            // Refresh state via DB reload instead of manually mutating local state
            await loadSnapshots(request.resume_version_id);
            
            return null;
        },
        [loadSnapshots]
    );

    const updateSnapshot = useCallback(
        async (id: string, request: UpdateAnalysisSnapshotRequest): Promise<AnalysisHookError | null> => {
            setIsLoading(true);
            setError(null);

            const { error: serviceError } = await analysisService.updateSnapshot(id, request);

            if (!mountedRef.current) return null;

            if (serviceError) {
                setError(serviceError);
                setIsLoading(false);
                return serviceError;
            }

            // Refresh state via DB reload instead of manually mutating local state
            if (resumeVersionId) {
                await loadSnapshots(resumeVersionId);
            } else {
                setIsLoading(false);
            }

            return null;
        },
        [resumeVersionId, loadSnapshots]
    );

    const refreshSnapshots = useCallback(async (): Promise<void> => {
        if (!resumeVersionId) return;
        await loadSnapshots(resumeVersionId);
    }, [resumeVersionId, loadSnapshots]);

    // ─── Return ──────────────────────────────────────────────────────────────────

    return {
        latestSnapshot,
        snapshots,
        isLoading,
        error,
        createSnapshot,
        updateSnapshot,
        refreshSnapshots,
    };
}
