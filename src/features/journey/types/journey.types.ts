// ─── Role union ───────────────────────────────────────────────────────────────

export type JourneyRole =
    | 'Frontend Engineer'
    | 'React Developer'
    | 'Next.js Developer';

export type LegacyJourneyRole =
    | 'Software Engineer'
    | 'Backend Engineer'
    | 'Full Stack Engineer';

export type PersistedJourneyRole = JourneyRole | LegacyJourneyRole;

export function isJourneyRole(value: string): value is JourneyRole {
    return ['Frontend Engineer', 'React Developer', 'Next.js Developer'].includes(value);
}

// ─── Experience level union ───────────────────────────────────────────────────

export type ExperienceLevel =
    | 'Student'
    | 'Fresher'
    | 'Junior'
    | 'Mid-Level';

// ─── Core entity — mirrors the database row exactly ──────────────────────────

export interface Journey {
    id: string;
    user_id: string;
    target_role: PersistedJourneyRole;
    experience_level: ExperienceLevel;
    timeline_months: number;
    daily_study_hours: number;
    created_at: string;
    updated_at: string;
}

// ─── Request types ────────────────────────────────────────────────────────────

/** Payload sent when creating a new journey. */
export interface CreateJourneyRequest {
    target_role: JourneyRole;
    experience_level: ExperienceLevel;
    timeline_months: number;
    daily_study_hours: number;
}

export interface UpdateJourneyRequest {
    target_role?: JourneyRole;
    experience_level?: ExperienceLevel;
    timeline_months?: number;
    daily_study_hours?: number;
}
