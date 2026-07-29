import { supabase } from '@/lib/supabase';
import { roadmapPlanSchema } from '../schemas/roadmap.schema';
import type { ActiveRoadmapView, RoadmapPhaseView, RoadmapTaskView } from '../types/roadmap-view.types';

export type RoadmapServiceError = { message: string; details?: unknown };

export const roadmapReadService = {
  async getActiveRoadmap(journeyId: string): Promise<{ data: ActiveRoadmapView | null; error: RoadmapServiceError | null }> {
    try {
      // 1. Query active pointer
      const { data: activePointer, error: pointerError } = await supabase
        .from('roadmap_active_versions')
        .select('roadmap_version_id')
        .eq('journey_id', journeyId)
        .maybeSingle();
        
      if (pointerError) {
        return { data: null, error: { message: 'Failed to read active roadmap pointer.', details: pointerError } };
      }
      
      if (!activePointer) {
        return { data: null, error: null }; // No active roadmap
      }
      
      const versionId = activePointer.roadmap_version_id;
      
      // 2. Query roadmap version
      const { data: versionData, error: versionError } = await supabase
        .from('roadmap_versions')
        .select('plan_data')
        .eq('id', versionId)
        .single();
        
      if (versionError || !versionData) {
        return { data: null, error: { message: 'Active roadmap version not found.', details: versionError } };
      }
      
      // 3. Runtime validate plan_data
      const parseResult = roadmapPlanSchema.safeParse(versionData.plan_data);
      if (!parseResult.success) {
        return { data: null, error: { message: 'Roadmap data is malformed.', details: parseResult.error.format() } };
      }
      const plan = parseResult.data;
      
      // 4. Query progress rows
      const { data: progressRows, error: progressError } = await supabase
        .from('roadmap_task_progress')
        .select('task_id, status, completed_at, skipped_at, user_notes')
        .eq('roadmap_version_id', versionId);
        
      if (progressError) {
        return { data: null, error: { message: 'Failed to read task progress.', details: progressError } };
      }
      
      // Build map
      const progressMap = new Map<string, any>();
      if (progressRows) {
        for (const row of progressRows) {
          if (progressMap.has(row.task_id)) {
            return { data: null, error: { message: 'Data Integrity Error: Duplicate task progress rows exist.' } };
          }
          progressMap.set(row.task_id, row);
        }
      }
      
      // 5. Merge purely and compute metrics
      let totalTasks = 0;
      let doneTasks = 0;
      let skippedTasks = 0;
      let pendingTasks = 0;
      
      const phases: RoadmapPhaseView[] = plan.phases.map(phase => {
        const tasks: RoadmapTaskView[] = phase.tasks.map(task => {
          totalTasks++;
          const progress = progressMap.get(task.id);
          
          let status: 'PENDING'|'DONE'|'SKIPPED' = 'PENDING';
          if (progress?.status === 'DONE') {
            status = 'DONE';
            doneTasks++;
          } else if (progress?.status === 'SKIPPED') {
            status = 'SKIPPED';
            skippedTasks++;
          } else {
            pendingTasks++;
          }
          
          return {
            id: task.id,
            type: task.type,
            title: task.title,
            description: task.description,
            skillSlug: task.skillSlug,
            order: task.order,
            rationale: task.rationale,
            status,
            completedAt: progress?.completed_at ?? null,
            skippedAt: progress?.skipped_at ?? null,
            userNotes: progress?.user_notes ?? null,
          };
        });
        
        return {
          id: phase.id,
          title: phase.title,
          objective: phase.objective,
          order: phase.order,
          tasks
        };
      });
      
      // SKIPPED tasks represent requirements the user intentionally bypassed.
      // Completion percentage is strictly based on DONE tasks.
      const completedCount = doneTasks;
      const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);
      
      const view: ActiveRoadmapView = {
        versionId,
        journeyId,
        schemaVersion: plan.schemaVersion,
        roleSlug: plan.roleSlug,
        generatedAt: plan.generatedAt,
        strategy: plan.strategy,
        phases,
        totalTasks,
        doneTasks,
        skippedTasks,
        pendingTasks,
        completionPercentage
      };
      
      return { data: view, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Unexpected error.', details: err } };
    }
  }
};
