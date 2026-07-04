import type { GapPriority } from '@/features/gaps/types/gap.types';

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
// C. Immutable roadmap version
// ============================================================================

export type ImmutableRoadmapVersion = {
  readonly id: string;
  readonly userId: string;
  readonly journeyId: string;
  readonly provenance: RoadmapGenerationProvenance;
  readonly planData: readonly RoadmapModule[];
  readonly createdAt: string;
};

// ============================================================================
// D. Roadmap module
// ============================================================================

export type RoadmapModule = {
  readonly skillId: string;
  readonly canonicalName: string;
  readonly priority: GapPriority;
  readonly priorityScore: number;
  readonly tasks: readonly RoadmapTask[];
};

// ============================================================================
// E. Roadmap task
// ============================================================================
// id is application-generated version-local UUID.
// No cross-version identity semantics exist.

export type RoadmapTask = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
};

// ============================================================================
// F. Active pointer contract
// ============================================================================

export type RoadmapActivePointer = {
  readonly journeyId: string;
  readonly roadmapVersionId: string;
  readonly updatedAt: string;
};

// ============================================================================
// G. Task progress contract
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
