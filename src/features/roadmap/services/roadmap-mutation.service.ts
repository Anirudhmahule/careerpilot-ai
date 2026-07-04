import { supabase } from '@/lib/supabase';
import type { RoadmapServiceError } from './roadmap-read.service';

export type MutateTaskProgressRequest = {
  roadmapVersionId: string;
  taskId: string;
  status: 'PENDING' | 'DONE' | 'SKIPPED';
  userNotes?: string | null;
};

export type GenerateRoadmapRequest = {
  journeyId: string;
  analysisSnapshotId: string;
  roleId: string;
};

export const roadmapMutationService = {
  async mutateTaskProgress(request: MutateTaskProgressRequest): Promise<{ data: any; error: RoadmapServiceError | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('mutate-task-progress', {
        body: request,
      });

      if (error) {
        return { data: null, error: { message: error.message ?? 'Network failure while invoking edge function.' } };
      }

      // Check if function returned an error in the response body
      if (data && data.error) {
        return { data: null, error: { message: data.error, details: data.details } };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Unexpected frontend error.', details: err } };
    }
  },

  async generateRoadmap(request: GenerateRoadmapRequest): Promise<{ data: any; error: RoadmapServiceError | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-roadmap', {
        body: request,
      });

      if (error) {
        return { data: null, error: { message: error.message ?? 'Network failure while invoking edge function.' } };
      }

      if (data && data.error) {
        return { data: null, error: { message: data.error, details: data.details } };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Unexpected frontend error.', details: err } };
    }
  }
};
