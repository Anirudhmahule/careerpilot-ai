import type { GapPriority, GapResult } from '@/features/gaps/types/gap.types';
import type { RoleSkillRequirement } from '@/features/taxonomy/types/taxonomy.types';

// ============================================================================
// A. Raw AI generation output
// ============================================================================

export type RawRoadmapTask = {
  readonly title: string;
  readonly description: string;
};

export type RawRoadmapModule = {
  readonly moduleSkillId: string;
  readonly tasks: readonly RawRoadmapTask[];
};

export type RawRoadmapGeneration = {
  readonly modules: readonly RawRoadmapModule[];
};

// ============================================================================
// B. Immutable roadmap generation provenance
// ============================================================================

export type RoadmapGenerationProvenance = {
  readonly analysisSnapshotId: string;
  readonly roleId: string;
  readonly roleSlug: string;
  readonly generationStrategy: 'hybrid-v1';
  readonly promptVersion: string;
  readonly model: string;
  readonly roleRequirementsFingerprint: string;
  readonly roleRequirementsFingerprintVersion: string;
};

// ============================================================================
// C. Immutable roadmap plan contract
// ============================================================================

export const ROADMAP_PLAN_SCHEMA_VERSION = 'roadmap-plan-v1';

export type RoadmapPlanSchemaVersion = typeof ROADMAP_PLAN_SCHEMA_VERSION;

export type RoadmapPlanStrategy = 'deterministic-v1';

export type RoadmapTaskType = 'LEARN' | 'PRACTICE' | 'BUILD' | 'VALIDATE';

export type RoadmapPlan = {
  readonly schemaVersion: RoadmapPlanSchemaVersion;
  readonly roleSlug: string;
  readonly generatedAt: string;
  readonly strategy: RoadmapPlanStrategy;
  readonly phases: readonly RoadmapPhase[];
};

// ============================================================================
// D. Roadmap phase
// ============================================================================

export type RoadmapPhase = {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly order: number;
  readonly tasks: readonly RoadmapTask[];
};

// ============================================================================
// E. Roadmap task
// ============================================================================
// id is application-generated and deterministic for stable semantic task identity.

export type RoadmapTask = {
  readonly id: string;
  readonly type: RoadmapTaskType;
  readonly title: string;
  readonly description: string;
  readonly skillSlug: string;
  readonly priority: GapPriority;
  readonly order: number;
  readonly rationale: string;
  readonly sourceGapIds: readonly string[];
};

// ============================================================================
// F. Deterministic planner input
// ============================================================================

export type RoadmapTargetRole = {
  readonly roleId: string;
  readonly roleSlug: string;
  readonly roleName?: string;
};

export type RoadmapPlannerInput = {
  readonly targetRole: RoadmapTargetRole;
  readonly gapResult: GapResult;
  readonly roleRequirements: readonly RoleSkillRequirement[];
  readonly generatedAt: string;
  readonly strategy?: RoadmapPlanStrategy;
};

// ============================================================================
// G. Immutable roadmap version
// ============================================================================

export type ImmutableRoadmapVersion = {
  readonly id: string;
  readonly userId: string;
  readonly journeyId: string;
  readonly provenance: RoadmapGenerationProvenance;
  readonly planData: RoadmapPlan;
  readonly createdAt: string;
};

// ============================================================================
// H. Active pointer contract
// ============================================================================

export type RoadmapActivePointer = {
  readonly journeyId: string;
  readonly roadmapVersionId: string;
  readonly updatedAt: string;
};

// ============================================================================
// I. Task progress contract
// ============================================================================

export type RoadmapTaskProgress = {
  readonly id: string; // immutable identity
  readonly userId: string; // immutable ownership reference
  readonly roadmapVersionId: string; // immutable version reference
  readonly taskId: string; // immutable logical task reference
  status: 'PENDING' | 'DONE' | 'SKIPPED'; // mutable
  completedAt: string | null; // mutable
  skippedAt: string | null; // mutable
  userNotes: string | null; // mutable
  readonly createdAt: string; // immutable system timestamp
  updatedAt: string; // mutable system timestamp
};
