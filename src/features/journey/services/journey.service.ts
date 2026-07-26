/**
 * JourneyService
 *
 * The single layer that reads and writes journey records in Supabase.
 * No UI logic, no navigation, no React hooks, no toast notifications.
 * All callers receive a typed { data, error } result — they decide what to do.
 */

import { supabase } from '@/lib/supabase';
import type {
    Journey,
    CreateJourneyRequest,
    UpdateJourneyRequest,
} from '../types/journey.types';

// ─── Result envelope ──────────────────────────────────────────────────────────

export interface JourneyServiceError {
    message: string;
    code?: string;
}

export interface JourneyResult<T = void> {
    data: T | null;
    error: JourneyServiceError | null;
}

// ─── Error normaliser ─────────────────────────────────────────────────────────

/**
 * Converts any thrown value into a consistent JourneyServiceError.
 * Handles Supabase PostgrestError objects (have .message + .code),
 * native Error instances, and unknown primitives.
 */
function normalizeJourneyError(err: unknown): JourneyServiceError {
    if (err !== null && typeof err === 'object') {
        const candidate = err as Record<string, unknown>;
        const message =
            typeof candidate['message'] === 'string'
                ? candidate['message']
                : 'An unexpected error occurred. Please try again.';
        const code =
            typeof candidate['code'] === 'string'
                ? candidate['code']
                : undefined;
        return { message, code };
    }
    if (err instanceof Error) {
        return { message: err.message };
    }
    return { message: 'An unexpected error occurred. Please try again.' };
}

// ─── Supabase table name ──────────────────────────────────────────────────────

const TABLE = 'journeys' as const;

// ─── Service interface ────────────────────────────────────────────────────────

export interface IJourneyService {
    /**
     * Insert a new journey row for the given user.
     * Returns the created Journey on success.
     */
    createJourney(
        userId: string,
        request: CreateJourneyRequest,
    ): Promise<JourneyResult<Journey>>;

    /**
     * Fetch the journey that belongs to a user.
     * Returns null data (not an error) when the user has no journey yet.
     */
    getJourneyByUserId(userId: string): Promise<JourneyResult<Journey>>;

    /**
     * Update an existing journey by its id.
     * Returns the updated Journey on success.
     */
    updateJourney(
        journeyId: string,
        request: UpdateJourneyRequest,
    ): Promise<JourneyResult<Journey>>;

    /**
     * Permanently delete a journey by its id.
     * Returns void data on success.
     */
    deleteJourney(journeyId: string): Promise<JourneyResult>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

class JourneyService implements IJourneyService {
    /**
     * Insert a new journey row.
     * Merges user_id into the row so callers never touch the column directly.
     */
    async createJourney(
        userId: string,
        request: CreateJourneyRequest,
    ): Promise<JourneyResult<Journey>> {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .insert({ ...request, user_id: userId })
                .select()
                .single();

            if (error) {
                // Postgres unique-violation code — the journeys_user_id_unique
                // constraint prevents a user from having more than one journey.
                if (error.code === '23505') {
                    return {
                        data: null,
                        error: { message: 'You already have a journey configured.', code: error.code },
                    };
                }
                return { data: null, error: normalizeJourneyError(error) };
            }

            return { data: data as Journey, error: null };
        } catch (err) {
            return { data: null, error: normalizeJourneyError(err) };
        }
    }

    /**
     * Return the single journey owned by userId.
     * Supabase returns an empty array when no row exists — we normalise that
     * to { data: null, error: null } so callers can distinguish "not found"
     * from a real error without checking error codes.
     */
    async getJourneyByUserId(userId: string): Promise<JourneyResult<Journey>> {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                return { data: null, error: normalizeJourneyError(error) };
            }

            // maybeSingle() returns null when no row matches — not an error
            return { data: (data as Journey) ?? null, error: null };
        } catch (err) {
            return { data: null, error: normalizeJourneyError(err) };
        }
    }

    /**
     * Apply a partial update to an existing journey.
     * Uses .select().single() to return the updated row so callers always
     * get the server-confirmed state, not just the request payload.
     */
    async updateJourney(
        journeyId: string,
        request: UpdateJourneyRequest,
    ): Promise<JourneyResult<Journey>> {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .update(request)
                .eq('id', journeyId)
                .select()
                .single();

            if (error) {
                return { data: null, error: normalizeJourneyError(error) };
            }

            return { data: data as Journey, error: null };
        } catch (err) {
            return { data: null, error: normalizeJourneyError(err) };
        }
    }

    /**
     * Hard-delete a journey row.
     * Returns { data: null, error: null } on success — callers check error
     * to determine outcome.
     */
    async deleteJourney(journeyId: string): Promise<JourneyResult> {
        try {
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq('id', journeyId);

            if (error) {
                return { data: null, error: normalizeJourneyError(error) };
            }

            return { data: null, error: null };
        } catch (err) {
            return { data: null, error: normalizeJourneyError(err) };
        }
    }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const journeyService: IJourneyService = new JourneyService();
