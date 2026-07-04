import { useCallback, useEffect, useState, useRef } from 'react';
import { roadmapReadService } from '../services/roadmap-read.service';
import { roadmapMutationService } from '../services/roadmap-mutation.service';
import type { RoadmapServiceError } from '../services/roadmap-read.service';
import type { ActiveRoadmapView } from '../types/roadmap-view.types';

export interface UseActiveRoadmapReturn {
  roadmap: ActiveRoadmapView | null;
  isLoading: boolean;
  error: RoadmapServiceError | null;
  pendingTaskIds: Set<string>;
  mutateTaskStatus: (taskId: string, status: 'PENDING' | 'DONE' | 'SKIPPED') => Promise<void>;
  refresh: () => Promise<void>;
  mutationError: RoadmapServiceError | null;
  isGenerating: boolean;
  generationError: RoadmapServiceError | null;
  generateRoadmap: (analysisSnapshotId: string, roleId: string) => Promise<void>;
}

export function useActiveRoadmap(journeyId: string | undefined | null): UseActiveRoadmapReturn {
  const [roadmap, setRoadmap] = useState<ActiveRoadmapView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<RoadmapServiceError | null>(null);
  const [mutationError, setMutationError] = useState<RoadmapServiceError | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<RoadmapServiceError | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async (isSilentRefresh = false) => {
    if (!journeyId) {
      setRoadmap(null);
      if (!isSilentRefresh) setIsLoading(false);
      return;
    }

    if (!isSilentRefresh) {
      setIsLoading(true);
      setError(null);
    }

    const { data, error: serviceError } = await roadmapReadService.getActiveRoadmap(journeyId);

    if (!mountedRef.current) return;

    if (serviceError) {
      if (!isSilentRefresh) setError(serviceError);
      if (!isSilentRefresh) setIsLoading(false);
      return;
    }

    setRoadmap(data);
    if (!isSilentRefresh) setIsLoading(false);
  }, [journeyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const mutateTaskStatus = useCallback(async (taskId: string, status: 'PENDING' | 'DONE' | 'SKIPPED') => {
    if (!roadmap) return;
    
    setMutationError(null);
    setPendingTaskIds(prev => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    const { error: mutError } = await roadmapMutationService.mutateTaskProgress({
      roadmapVersionId: roadmap.versionId,
      taskId,
      status
    });

    if (!mountedRef.current) return;

    if (mutError) {
      setMutationError(mutError);
      setPendingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      return;
    }

    // Success -> Authoritative Refresh
    await load(true);
    
    if (!mountedRef.current) return;
    
    setPendingTaskIds(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }, [roadmap, load]);

  const refresh = useCallback(async () => {
    await load(false);
  }, [load]);

  const generateRoadmap = useCallback(async (analysisSnapshotId: string, roleId: string) => {
    if (!journeyId || isGenerating) return;

    setGenerationError(null);
    setIsGenerating(true);

    const { error: genError } = await roadmapMutationService.generateRoadmap({
      journeyId,
      analysisSnapshotId,
      roleId
    });

    if (!mountedRef.current) return;

    if (genError) {
      setGenerationError(genError);
      setIsGenerating(false);
      return;
    }

    // Success -> Authoritative Refresh
    await load(true);
    
    // If refresh fails post-success, it'll show up in `error` via `load(true)` if we didn't silence it,
    // but we use `true` so it doesn't nuke the UI. Wait, if load(true) fails, the old roadmap might be stuck?
    // Let's rely on the load's error handling.
    if (!mountedRef.current) return;
    setIsGenerating(false);
  }, [journeyId, isGenerating, load]);

  return { roadmap, isLoading, error, pendingTaskIds, mutateTaskStatus, refresh, mutationError, isGenerating, generationError, generateRoadmap };
}
