/**
 * AnalysisAiService
 *
 * The single layer responsible for invoking the Supabase Edge Function
 * that runs the AI analysis pipeline.
 *
 * Responsibilities:
 *   - Call the `analyze-resume` Edge Function.
 *   - Pass analysisSnapshotId and storagePath.
 *   - Return a typed { data, error } result.
 *
 * This service does NOT:
 *   - Call OpenAI directly.
 *   - Read or write to the database — that is analysis.service.ts's job.
 *   - Contain UI logic, navigation, or React hooks.
 */

import { supabase } from "@/lib/supabase";

// ─── Result envelope ──────────────────────────────────────────────────────────

export interface AnalysisAiServiceError {
  message: string;
  code?: string;
}

export interface AnalysisAiResult<T = void> {
  data: T | null;
  error: AnalysisAiServiceError | null;
}

// ─── Response shape ───────────────────────────────────────────────────────────

export interface InvokeAnalysisResponse {
  /** Processing duration in milliseconds, as reported by the Edge Function. */
  processingTimeMs: number;
}

// ─── Error normaliser ─────────────────────────────────────────────────────────

function normalizeAnalysisAiError(err: unknown): AnalysisAiServiceError {
  if (err !== null && typeof err === "object") {
    const candidate = err as Record<string, unknown>;
    const message =
      typeof candidate["message"] === "string"
        ? candidate["message"]
        : "An unexpected error occurred. Please try again.";
    const code = typeof candidate["code"] === "string" ? candidate["code"] : undefined;
    return { message, code };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: "An unexpected error occurred. Please try again." };
}

// ─── Edge Function name ───────────────────────────────────────────────────────

const FUNCTION_NAME = "analyze-resume" as const;

// ─── Service interface ────────────────────────────────────────────────────────

export interface IAnalysisAiService {
  /**
   * Invoke the `analyze-resume` Edge Function.
   *
   * The Edge Function will:
   *   1. Download the PDF at `storagePath` from Supabase Storage.
   *   2. Extract text from the PDF.
   *   3. Call OpenAI GPT-5.5 and request structured JSON.
   *   4. Update the `analysis_snapshots` row identified by `analysisSnapshotId`
   *      with status, raw_response, processing_time_ms, and completed_at.
   *
   * On failure, the Edge Function will write status = 'failed' and error_message
   * to the same row before returning an error response.
   *
   * Returns `{ processingTimeMs }` on success, or an error on failure.
   */
  invokeAnalysis(
    analysisSnapshotId: string,
    storagePath: string
  ): Promise<AnalysisAiResult<InvokeAnalysisResponse>>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

class AnalysisAiService implements IAnalysisAiService {
  async invokeAnalysis(
    analysisSnapshotId: string,
    storagePath: string
  ): Promise<AnalysisAiResult<InvokeAnalysisResponse>> {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { analysisSnapshotId, storagePath },
      });

      if (error) {
        return { data: null, error: normalizeAnalysisAiError(error) };
      }

      // The Edge Function returns { success: true, processingTimeMs: number }
      const response = data as { processingTimeMs: number };

      return {
        data: { processingTimeMs: response.processingTimeMs },
        error: null,
      };
    } catch (err) {
      return { data: null, error: normalizeAnalysisAiError(err) };
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const analysisAiService: IAnalysisAiService = new AnalysisAiService();
