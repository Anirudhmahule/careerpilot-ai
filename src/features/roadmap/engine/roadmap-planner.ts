import type { GapPriority, SkillGap } from '@/features/gaps/types/gap.types';
import type {
  RequirementImportance,
  RoleSkillRequirement,
} from '@/features/taxonomy/types/taxonomy.types';
import { ROADMAP_PLAN_SCHEMA_VERSION } from '../types/roadmap.types';
import type {
  RoadmapPhase,
  RoadmapPlan,
  RoadmapPlannerInput,
  RoadmapTask,
  RoadmapTaskType,
} from '../types/roadmap.types';

type PhaseKey = 'missing-role-skills';

type PhaseDefinition = {
  readonly key: PhaseKey;
  readonly title: string;
  readonly objective: string;
};

type NormalizedRequirement = {
  readonly skillId: string;
  readonly skillSlug: string;
  readonly canonicalName: string;
  readonly importance: RequirementImportance;
};

type NormalizedGap = {
  readonly skillId: string;
  readonly skillSlug: string;
  readonly canonicalName: string;
  readonly importance: RequirementImportance;
  readonly priority: GapPriority;
  readonly priorityScore: number;
  readonly reason: string;
  readonly sourceGapIds: readonly string[];
};

const DEFAULT_STRATEGY = 'deterministic-v1' as const;

const IMPORTANCE_SCORE: Record<RequirementImportance, number> = {
  required: 3,
  important: 2,
  optional: 1,
};

const PRIORITY_SCORE: Record<GapPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const SCORE_PRIORITY: Record<number, GapPriority> = {
  3: 'high',
  2: 'medium',
  1: 'low',
};

const MISSING_ROLE_SKILLS_PHASE: PhaseDefinition = {
  key: 'missing-role-skills',
  title: 'Missing Role Skills',
  objective: 'Close target-role requirements that have no current resume evidence.',
};

const MISSING_SKILL_TASK_TYPES: readonly RoadmapTaskType[] = ['LEARN', 'BUILD'];

const UUID_HASH_SEEDS = [
  0x811c9dc5,
  0x9e3779b9,
  0x85ebca6b,
  0xc2b2ae35,
] as const;

export function buildRoadmapPlan(input: RoadmapPlannerInput): RoadmapPlan {
  assertPlannerInput(input);

  const normalizedGaps = normalizeGaps(input).sort(compareNormalizedGaps);
  const phases: RoadmapPhase[] = [];
  const tasks = buildTasksForMissingSkillGaps(normalizedGaps, input.targetRole.roleSlug);

  if (tasks.length > 0) {
    phases.push({
      id: createDeterministicRoadmapUuid([
        'roadmap-phase',
        input.targetRole.roleSlug,
        MISSING_ROLE_SKILLS_PHASE.key,
      ]),
      title: MISSING_ROLE_SKILLS_PHASE.title,
      objective: MISSING_ROLE_SKILLS_PHASE.objective,
      order: phases.length + 1,
      tasks,
    });
  }

  return {
    schemaVersion: ROADMAP_PLAN_SCHEMA_VERSION,
    roleSlug: input.targetRole.roleSlug,
    generatedAt: input.generatedAt,
    strategy: input.strategy ?? DEFAULT_STRATEGY,
    phases,
  };
}

/**
 * Creates deterministic RFC-compatible UUID v8 strings from stable semantic parts.
 * This is not a cryptographic UUID; collision risk is acceptable for small per-plan
 * roadmap identity sets and is bounded by the source semantic keys included here.
 */
export function createDeterministicRoadmapUuid(parts: readonly string[]): string {
  const canonical = JSON.stringify(parts);
  const bytes = UUID_HASH_SEEDS.flatMap((seed) => uint32ToBytes(hash32(canonical, seed)));

  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0'));

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

function assertPlannerInput(input: RoadmapPlannerInput): void {
  if (input.targetRole.roleId !== input.gapResult.roleId) {
    throw new Error('Roadmap planner roleId must match GapResult.roleId.');
  }

  if (input.targetRole.roleSlug !== input.gapResult.roleSlug) {
    throw new Error('Roadmap planner roleSlug must match GapResult.roleSlug.');
  }

  if (input.generatedAt.trim().length === 0) {
    throw new Error('Roadmap planner generatedAt must be supplied by the caller.');
  }
}

function normalizeGaps(input: RoadmapPlannerInput): NormalizedGap[] {
  const requirementsBySkillId = buildRequirementMap(input.roleRequirements);
  const groupedBySkillId = new Map<string, NormalizedGap>();

  for (const gap of input.gapResult.gaps) {
    const skillId = gap.skillId.trim();
    const skillSlug = gap.skillSlug.trim();

    if (skillId.length === 0) {
      throw new Error('Roadmap planner received a gap without a skillId.');
    }

    if (skillSlug.length === 0) {
      throw new Error(`Roadmap planner received a gap without a skillSlug for skillId: ${skillId}`);
    }

    const requirement = requirementsBySkillId.get(skillId);

    if (!requirement) {
      throw new Error(`Roadmap planner gap skillId is not present in role requirements: ${skillId}`);
    }

    if (requirement.skillSlug !== skillSlug) {
      throw new Error(`Roadmap planner skillSlug mismatch for skillId: ${skillId}`);
    }

    const canonicalName =
      firstNonEmpty(gap.canonicalName, requirement.canonicalName) ?? skillSlug;
    const importance = normalizeImportance(gap.importance, requirement.importance);
    const priorityScore = normalizePriorityScore(gap, importance);
    const priority = normalizePriority(gap.priority, priorityScore);
    const sourceGapId = createSourceGapId({
      roleSlug: input.targetRole.roleSlug,
      skillId,
      skillSlug,
      importance,
      priority,
    });

    const normalizedGap: NormalizedGap = {
      skillId,
      skillSlug,
      canonicalName,
      importance,
      priority,
      priorityScore,
      reason: firstNonEmpty(gap.reason) ?? buildFallbackGapReason(canonicalName, importance),
      sourceGapIds: [sourceGapId],
    };

    const existing = groupedBySkillId.get(skillId);
    if (!existing) {
      groupedBySkillId.set(skillId, normalizedGap);
      continue;
    }

    groupedBySkillId.set(skillId, mergeGap(existing, normalizedGap));
  }

  return Array.from(groupedBySkillId.values());
}

function buildRequirementMap(
  requirements: readonly RoleSkillRequirement[]
): ReadonlyMap<string, NormalizedRequirement> {
  const bySkillId = new Map<string, NormalizedRequirement>();

  for (const requirement of requirements) {
    const skillId = requirement.skillId.trim();
    const skillSlug = requirement.skillSlug.trim();

    if (skillId.length === 0 || skillSlug.length === 0) {
      continue;
    }

    const normalized: NormalizedRequirement = {
      skillId,
      skillSlug,
      canonicalName: requirement.canonicalName.trim(),
      importance: requirement.importance,
    };
    const existing = bySkillId.get(skillId);

    if (!existing || compareRequirementPrecedence(normalized, existing) < 0) {
      bySkillId.set(skillId, normalized);
    }
  }

  return bySkillId;
}

function mergeGap(a: NormalizedGap, b: NormalizedGap): NormalizedGap {
  const winner = compareNormalizedGaps(a, b) <= 0 ? a : b;
  const sourceGapIds = uniqueSortedStrings([...a.sourceGapIds, ...b.sourceGapIds]);

  return {
    ...winner,
    sourceGapIds,
  };
}

function buildTasksForMissingSkillGaps(
  gaps: readonly NormalizedGap[],
  roleSlug: string
): RoadmapTask[] {
  const tasks: RoadmapTask[] = [];
  const seenTaskKeys = new Set<string>();

  for (const gap of gaps) {
    for (const taskType of MISSING_SKILL_TASK_TYPES) {
      const taskKey = JSON.stringify([roleSlug, gap.skillSlug, taskType]);

      if (seenTaskKeys.has(taskKey)) {
        continue;
      }

      seenTaskKeys.add(taskKey);
      tasks.push(
        buildTask({
          gap,
          taskType,
          roleSlug,
          order: tasks.length + 1,
        })
      );
    }
  }

  return tasks;
}

function buildTask(input: {
  readonly gap: NormalizedGap;
  readonly taskType: RoadmapTaskType;
  readonly roleSlug: string;
  readonly order: number;
}): RoadmapTask {
  const { gap, taskType, roleSlug, order } = input;

  return {
    id: createDeterministicRoadmapUuid([
      'roadmap-task',
      roleSlug,
      gap.skillSlug,
      taskType,
      ...gap.sourceGapIds,
    ]),
    type: taskType,
    title: buildTaskTitle(taskType, gap.canonicalName),
    description: buildTaskDescription(taskType, gap.canonicalName, roleSlug),
    skillSlug: gap.skillSlug,
    priority: gap.priority,
    order,
    rationale: buildTaskRationale(gap, roleSlug),
    sourceGapIds: gap.sourceGapIds,
  };
}

function buildTaskTitle(taskType: RoadmapTaskType, canonicalName: string): string {
  if (taskType === 'LEARN') {
    return `Learn the required ${canonicalName} concepts`;
  }

  if (taskType === 'PRACTICE') {
    return `Practice ${canonicalName} with focused exercises`;
  }

  if (taskType === 'BUILD') {
    return `Build evidence for ${canonicalName}`;
  }

  return `Validate ${canonicalName} evidence`;
}

function buildTaskDescription(
  taskType: RoadmapTaskType,
  canonicalName: string,
  roleSlug: string
): string {
  if (taskType === 'LEARN') {
    return `Study the ${canonicalName} concepts needed to address the missing ${roleSlug} role requirement.`;
  }

  if (taskType === 'PRACTICE') {
    return `Complete focused ${canonicalName} exercises that reinforce day-to-day role usage.`;
  }

  if (taskType === 'BUILD') {
    return `Create a small, resume-worthy artifact that demonstrates ${canonicalName} in a role-relevant context.`;
  }

  return `Collect or refine evidence that clearly supports ${canonicalName} for the target role.`;
}

function buildTaskRationale(gap: NormalizedGap, roleSlug: string): string {
  return `${gap.reason} This task addresses the missing ${gap.canonicalName} requirement for ${roleSlug}.`;
}

function createSourceGapId(input: {
  readonly roleSlug: string;
  readonly skillId: string;
  readonly skillSlug: string;
  readonly importance: RequirementImportance;
  readonly priority: GapPriority;
}): string {
  return createDeterministicRoadmapUuid([
    'source-gap',
    'missing-skill',
    input.roleSlug,
    input.skillId,
    input.skillSlug,
    input.importance,
    input.priority,
  ]);
}

function buildFallbackGapReason(
  canonicalName: string,
  importance: RequirementImportance
): string {
  return `${canonicalName} is ${importance} for the target role and is missing from current resume evidence.`;
}

function normalizeImportance(
  importance: RequirementImportance,
  fallback?: RequirementImportance
): RequirementImportance {
  if (isRequirementImportance(importance)) {
    return importance;
  }

  return fallback ?? 'optional';
}

function normalizePriorityScore(gap: SkillGap, importance: RequirementImportance): number {
  if (gap.priorityScore === 3 || gap.priorityScore === 2 || gap.priorityScore === 1) {
    return gap.priorityScore;
  }

  return IMPORTANCE_SCORE[importance];
}

function normalizePriority(priority: GapPriority, priorityScore: number): GapPriority {
  if (isGapPriority(priority) && PRIORITY_SCORE[priority] === priorityScore) {
    return priority;
  }

  return SCORE_PRIORITY[priorityScore] ?? 'low';
}

function compareNormalizedGaps(a: NormalizedGap, b: NormalizedGap): number {
  if (a.priorityScore !== b.priorityScore) {
    return b.priorityScore - a.priorityScore;
  }

  const slugCompare = compareText(a.skillSlug, b.skillSlug);
  if (slugCompare !== 0) {
    return slugCompare;
  }

  const sourceGapCompare = compareText(a.sourceGapIds[0] ?? '', b.sourceGapIds[0] ?? '');
  if (sourceGapCompare !== 0) {
    return sourceGapCompare;
  }

  return compareText(a.skillId, b.skillId);
}

function compareRequirementPrecedence(
  a: NormalizedRequirement,
  b: NormalizedRequirement
): number {
  if (IMPORTANCE_SCORE[a.importance] !== IMPORTANCE_SCORE[b.importance]) {
    return IMPORTANCE_SCORE[b.importance] - IMPORTANCE_SCORE[a.importance];
  }

  return compareText(a.canonicalName, b.canonicalName);
}

function compareText(a: string, b: string): number {
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function uniqueSortedStrings(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values)).sort(compareText);
}

function isRequirementImportance(value: string): value is RequirementImportance {
  return value === 'required' || value === 'important' || value === 'optional';
}

function isGapPriority(value: string): value is GapPriority {
  return value === 'high' || value === 'medium' || value === 'low';
}

function hash32(value: string, seed: number): number {
  let hash = seed >>> 0;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
    hash ^= hash >>> 13;
  }

  return hash >>> 0;
}

function uint32ToBytes(value: number): number[] {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ];
}
