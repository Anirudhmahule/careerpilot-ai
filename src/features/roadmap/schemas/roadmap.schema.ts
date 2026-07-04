import { z } from 'zod';

// ============================================================================
// Raw AI Output Schema
// ============================================================================

export const rawRoadmapTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(600),
}).strict();

export const rawRoadmapModuleSchema = z.object({
  moduleSkillId: z.string().trim().min(1),
  tasks: z.array(rawRoadmapTaskSchema)
    .length(3, 'Exactly 3 tasks are required per gap module.')
    .refine((tasks) => {
      const titles = tasks.map((t) => t.title.toLowerCase());
      return new Set(titles).size === titles.length;
    }, 'Duplicate task titles within a module are not allowed.'),
}).strict();

export const rawRoadmapGenerationSchema = z.object({
  modules: z.array(rawRoadmapModuleSchema),
}).strict();

export type RawRoadmapGeneration = z.infer<typeof rawRoadmapGenerationSchema>;

// ============================================================================
// Immutable Roadmap Plan Schema (Persistence Boundary)
// ============================================================================

export const roadmapTaskSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['LEARN', 'PRACTICE', 'BUILD', 'VALIDATE']),
  title: z.string().min(1),
  description: z.string().min(1),
  skillSlug: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
  order: z.number().int().positive(),
  rationale: z.string().min(1),
  sourceGapIds: z.array(z.string().uuid()).min(1),
}).strict();

export const roadmapPhaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  objective: z.string().min(1),
  order: z.number().int().positive(),
  tasks: z.array(roadmapTaskSchema),
}).strict();

export const roadmapPlanSchema = z.object({
  schemaVersion: z.literal('roadmap-plan-v1'),
  roleSlug: z.string().min(1),
  generatedAt: z.string().datetime(),
  strategy: z.literal('deterministic-v1'),
  phases: z.array(roadmapPhaseSchema),
}).strict();
