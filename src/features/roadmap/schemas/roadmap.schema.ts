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
