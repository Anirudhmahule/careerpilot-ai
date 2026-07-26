import type { RoadmapTaskType, RoadmapPlanStrategy, RoadmapPlanSchemaVersion } from './roadmap.types';

export type RoadmapTaskView = {
  readonly id: string;
  readonly type: RoadmapTaskType;
  readonly title: string;
  readonly description: string;
  readonly skillSlug: string;
  readonly order: number;
  readonly rationale: string;
  readonly status: 'PENDING' | 'DONE' | 'SKIPPED';
  readonly completedAt: string | null;
  readonly skippedAt: string | null;
  readonly userNotes: string | null;
};

export type RoadmapPhaseView = {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly order: number;
  readonly tasks: readonly RoadmapTaskView[];
};

export type ActiveRoadmapView = {
  readonly versionId: string;
  readonly journeyId: string;
  readonly schemaVersion: RoadmapPlanSchemaVersion;
  readonly roleSlug: string;
  readonly generatedAt: string;
  readonly strategy: RoadmapPlanStrategy;
  readonly phases: readonly RoadmapPhaseView[];
  
  // Derived metrics
  readonly totalTasks: number;
  readonly doneTasks: number;
  readonly skippedTasks: number;
  readonly pendingTasks: number;
  readonly completionPercentage: number;
};
