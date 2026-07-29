// ─── Core entity — mirrors the database row exactly ──────────────────────────

export interface ResumeVersion {
    id: string;
    user_id: string;
    journey_id: string;
    file_name: string;
    storage_path: string;
    file_size: number;
    version_number: number;
    uploaded_at: string;
}

// ─── Request types ────────────────────────────────────────────────────────────

/** Payload sent when uploading a new resume version. */
export interface CreateResumeRequest {
    journey_id: string;
    file_name: string;
    storage_path: string;
    file_size: number;
}
