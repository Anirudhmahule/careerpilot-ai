import { supabase } from '@/lib/supabase';
import type { 
  ValidationGenerationRow, 
  ValidationQuestionRow,
  MutateValidationAnswerRequest,
  ValidationQuestionOptionRow,
  ValidationAnswerRow
} from '../types/validation.types';

export interface ValidationServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

export type GenerateValidationQuestionsRequest = {
  analysisSnapshotId: string;
  roleId: string;
};

export const validationService = {
  /**
   * Get the latest validation generation for a snapshot
   */
  async getLatestGeneration(snapshotId: string): Promise<{ data: ValidationGenerationRow | null; error: ValidationServiceError | null }> {
    try {
      const { data, error } = await supabase
        .from('validation_generations')
        .select('*')
        .eq('analysis_snapshot_id', snapshotId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: null, error: { message: error.message, code: error.code, details: error.details } };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Unexpected frontend error.', details: err } };
    }
  },

  /**
   * Get the latest COMPLETED generation for a snapshot
   * Used by the taxonomy engine to verify validated evidence exists.
   */
  async getLatestCompletedGeneration(snapshotId: string): Promise<{ data: ValidationGenerationRow | null; error: ValidationServiceError | null }> {
    try {
      const { data, error } = await supabase
        .from('validation_generations')
        .select('*')
        .eq('analysis_snapshot_id', snapshotId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: null, error: { message: error.message, code: error.code, details: error.details } };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Unexpected frontend error.', details: err } };
    }
  },

  /**
   * Get questions with their options and user answers for a generation.
   * Alias for getQuestions() intended for taxonomy data access.
   */
  async getQuestionsWithAnswers(generationId: string): Promise<{ data: ValidationQuestionRow[] | null; error: ValidationServiceError | null }> {
    return this.getQuestions(generationId);
  },

  /**
   * Get questions, options, and user answers for a generation
   */
  async getQuestions(generationId: string): Promise<{ data: ValidationQuestionRow[] | null; error: ValidationServiceError | null }> {
    try {
      const { data, error } = await supabase
        .from('validation_questions')
        .select(`
          *,
          validation_question_options (*),
          validation_answers (*)
        `)
        .eq('generation_id', generationId)
        .order('order_index', { ascending: true });

      if (error) {
        return { data: null, error: { message: error.message, code: error.code, details: error.details } };
      }

      // Ensure that options are ordered and answers are well formed (there should only be one answer per user, which RLS ensures is the current user's)
      const typedData = (data || []).map((q: any) => ({
        ...q,
        validation_question_options: (q.validation_question_options || []).sort((a: ValidationQuestionOptionRow, b: ValidationQuestionOptionRow) => a.order_index - b.order_index),
        validation_answers: q.validation_answers || [],
      })) as ValidationQuestionRow[];

      return { data: typedData, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Unexpected frontend error.', details: err } };
    }
  },

  /**
   * Trigger the AI edge function to generate validation questions
   */
  async generateQuestions(request: GenerateValidationQuestionsRequest): Promise<{ data: any; error: ValidationServiceError | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-validation-questions', {
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
  },

  /**
   * Submit or update an answer using the edge function
   */
  async submitAnswer(request: MutateValidationAnswerRequest): Promise<{ data: any; error: ValidationServiceError | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('mutate-validation-answer', {
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
