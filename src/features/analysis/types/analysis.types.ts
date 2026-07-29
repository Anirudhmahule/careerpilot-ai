// ─── Core entity — mirrors the database row exactly ──────────────────────────

export interface AnalysisSnapshot {
    id: string;
    resume_version_id: string;
    status: AnalysisStatus;
    model: string;
    prompt_version: string;
    raw_response: Record<string, unknown> | null;
    processing_time_ms: number | null;
    error_message: string | null;
    created_at: string;
    completed_at: string | null;
}

// ─── Request types ────────────────────────────────────────────────────────────

/** Payload sent when creating a new analysis snapshot. */
export interface CreateAnalysisSnapshotRequest {
    resume_version_id: string;
    model: string;
    prompt_version: string;
}

/** Payload sent to update an analysis snapshot after AI processing. */
export interface UpdateAnalysisSnapshotRequest {
    status?: string;
    raw_response?: Record<string, unknown> | null;
    processing_time_ms?: number | null;
    error_message?: string | null;
    completed_at?: string | null;
}

export type AnalysisStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed';
