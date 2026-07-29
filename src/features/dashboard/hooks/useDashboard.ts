import { useMemo } from 'react';
import { useJourney } from '@/features/journey/hooks/useJourney';
import { useResume } from '@/features/resume/hooks/useResume';
import { useTaxonomy } from '@/features/taxonomy/hooks/useTaxonomy';
import { useReadiness } from '@/features/readiness/hooks/useReadiness';
import { useGaps } from '@/features/gaps/hooks/useGaps';
import { useActiveRoadmap } from '@/features/roadmap/hooks/use-active-roadmap';
import { mapTargetRoleToTaxonomySlug } from '@/features/taxonomy/utils/role-mapping';
import type { DashboardViewModel, DashboardContext, DashboardReadiness, DashboardSkills, DashboardGaps, DashboardRoadmap } from '../types/dashboard.types';

export interface UseDashboardReturn {
  data: DashboardViewModel | null;
  isLoading: {
    context: boolean;
    insights: boolean;
    roadmap: boolean;
  };
  error: { message: string; stage: string } | null;
}

export function useDashboard(): UseDashboardReturn {
  const journeyState = useJourney();
  const resumeState = useResume();
  
  // Convert target_role to slug if possible
  const roleMapping = mapTargetRoleToTaxonomySlug(journeyState.journey?.target_role);
  const roleSlug = roleMapping.supported ? roleMapping.slug : undefined;

  const taxonomyState = useTaxonomy(resumeState.latestResume?.id, roleSlug);
  const readinessState = useReadiness(taxonomyState.matchResult);
  const gapsState = useGaps(taxonomyState.matchResult);
  const roadmapState = useActiveRoadmap(journeyState.journey?.id);

  // Aggregate errors securely.
  const fatalError = journeyState.error 
    ? { message: journeyState.error.message, stage: 'journey' } 
    : null;

  const viewModel = useMemo(() => {
    if (fatalError || !journeyState.journey) return null;

    const context: DashboardContext = {
      targetRole: journeyState.journey.target_role,
      latestResumeId: resumeState.latestResume?.id ?? null,
      latestResumeName: resumeState.latestResume?.file_name ?? null,
      latestCompletedAnalysisAt: taxonomyState.snapshotCreatedAt,
    };

    let readiness: DashboardReadiness | null = null;
    let skills: DashboardSkills | null = null;
    let gaps: DashboardGaps | null = null;
    let roadmap: DashboardRoadmap | null = null;

    if (readinessState.isReady && readinessState.readiness) {
      readiness = {
        score: readinessState.readiness.overallScore,
        requirementCoverage: readinessState.readiness.requirementCoverage,
        evidenceStrength: readinessState.readiness.evidenceStrength,
      };
      
      skills = {
        matchedCount: readinessState.readiness.matchedRequiredCount,
        missingCount: gapsState.gaps?.summary.totalGapCount ?? 0,
        totalRequiredCount: readinessState.readiness.totalRequiredCount,
      };
    }

    if (gapsState.isReady && gapsState.gaps) {
      gaps = {
        total: gapsState.gaps.summary.totalGapCount,
        highPriorityCount: gapsState.gaps.summary.highPriorityCount,
        mediumPriorityCount: gapsState.gaps.summary.mediumPriorityCount,
        lowPriorityCount: gapsState.gaps.summary.lowPriorityCount,
        topGaps: gapsState.gaps.gaps.slice(0, 3),
      };
    }

    if (!roadmapState.error && roadmapState.roadmap) {
      const rm = roadmapState.roadmap;
      const currentPhase = rm.phases.find(p => p.tasks.some(t => t.status === 'PENDING')) ?? null;
      const nextPendingTasks = rm.phases.flatMap(p => p.tasks).filter(t => t.status === 'PENDING').slice(0, 3);
      
      roadmap = {
        hasActiveRoadmap: true,
        totalTasks: rm.totalTasks,
        doneTasks: rm.doneTasks,
        pendingTasks: rm.pendingTasks,
        skippedTasks: rm.skippedTasks,
        completionPercentage: rm.completionPercentage,
        generatedAt: rm.generatedAt,
        currentPhase,
        nextPendingTasks,
        phases: rm.phases,
      };
    } else if (!roadmapState.isLoading && !roadmapState.error) {
      // Valid empty state
      roadmap = {
        hasActiveRoadmap: false,
        totalTasks: 0,
        doneTasks: 0,
        pendingTasks: 0,
        skippedTasks: 0,
        completionPercentage: 0,
        generatedAt: null,
        currentPhase: null,
        nextPendingTasks: [],
        phases: [],
      };
    }

    return {
      context,
      readiness,
      skills,
      gaps,
      roadmap,
    };
  }, [
    fatalError,
    journeyState.journey,
    resumeState.latestResume,
    taxonomyState.snapshotCreatedAt,
    readinessState,
    gapsState,
    roadmapState.roadmap,
    roadmapState.isLoading,
    roadmapState.error
  ]);

  return {
    data: viewModel,
    isLoading: {
      context: journeyState.isLoading || resumeState.isLoading,
      insights: taxonomyState.isLoading,
      roadmap: roadmapState.isLoading,
    },
    error: fatalError,
  };
}
