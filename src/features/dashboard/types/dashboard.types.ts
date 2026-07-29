import type { SkillGap } from '@/features/gaps/types/gap.types';
import type { RoadmapPhaseView, RoadmapTaskView } from '@/features/roadmap/types/roadmap-view.types';
import type { ReadinessComponent } from '@/features/readiness/types/readiness.types';

export interface DashboardContext {
  readonly targetRole: string | null;
  readonly latestResumeId: string | null;
  readonly latestResumeName: string | null;
  readonly latestCompletedAnalysisAt: string | null;
}

export interface DashboardReadiness {
  readonly score: number;
  readonly requirementCoverage: ReadinessComponent;
  readonly evidenceStrength: ReadinessComponent;
}

export interface DashboardSkills {
  readonly matchedCount: number;
  readonly missingCount: number;
  readonly totalRequiredCount: number;
}

export interface DashboardGaps {
  readonly total: number;
  readonly highPriorityCount: number;
  readonly mediumPriorityCount: number;
  readonly lowPriorityCount: number;
  readonly topGaps: readonly SkillGap[];
}

export interface DashboardRoadmap {
  readonly hasActiveRoadmap: boolean;
  readonly totalTasks: number;
  readonly doneTasks: number;
  readonly pendingTasks: number;
  readonly skippedTasks: number;
  readonly completionPercentage: number;
  readonly generatedAt: string | null;
  readonly currentPhase: RoadmapPhaseView | null;
  readonly nextPendingTasks: readonly RoadmapTaskView[];
  readonly phases: readonly RoadmapPhaseView[];
}

export interface DashboardViewModel {
  readonly context: DashboardContext;
  readonly readiness: DashboardReadiness | null;
  readonly skills: DashboardSkills | null;
  readonly gaps: DashboardGaps | null;
  readonly roadmap: DashboardRoadmap | null;
}

