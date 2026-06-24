import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { journeyService } from '../services/journey.service';
import type { JourneyServiceError } from '../services/journey.service';
import type {
    Journey,
    CreateJourneyRequest,
    UpdateJourneyRequest,
} from '../types/journey.types';

// ─── Public hook return type ──────────────────────────────────────────────────

export interface UseJourneyReturn {
    /** The user's journey, or null if they haven't created one yet. */
    journey: Journey | null;
    /** True while the initial load or any action is in-flight. */
    isLoading: boolean;
    /** The last error from a load or action, or null if everything is fine. */
    error: JourneyServiceError | null;
    /** Create a new journey for the current user. Returns an error on failure. */
    createJourney(request: CreateJourneyRequest): Promise<JourneyServiceError | null>;
    /** Update the current user's journey. Returns an error on failure. */
    updateJourney(request: UpdateJourneyRequest): Promise<JourneyServiceError | null>;
    /** Delete the current user's journey. Returns an error on failure. */
    deleteJourney(): Promise<JourneyServiceError | null>;
    /** Manually re-fetch the journey from the database. */
    refreshJourney(): Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useJourney(): UseJourneyReturn {
    const { user, isLoading: isAuthLoading } = useAuth();

    const [journey, setJourney] = useState<Journey | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<JourneyServiceError | null>(null);

    // mountedRef guards action callbacks (createJourney, updateJourney, deleteJourney)
    // which are called imperatively and can't use the per-effect cancelled flag.
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // ─── Load ───────────────────────────────────────────────────────────────────

    const loadJourney = useCallback(async (userId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        console.log('[useJourney] loading journey for user:', userId);

        const { data, error: serviceError } = await journeyService.getJourneyByUserId(userId);

        console.log('[useJourney] result:', { data, error: serviceError });

        if (!mountedRef.current) {
            console.warn('[useJourney] loadJourney: component unmounted before response, dropping result');
            return;
        }

        if (serviceError) {
            console.error('[useJourney] loadJourney error:', serviceError);
            setError(serviceError);
            setIsLoading(false);
            return;
        }

        console.log('[useJourney] setJourney:', data);
        setJourney(data);
        setIsLoading(false);
    }, []);

    // Auto-load once auth has resolved and a user is present.
    // Uses a per-run `cancelled` flag so Strict Mode double-invocation
    // cannot drop a valid response by flipping mountedRef mid-flight.
    useEffect(() => {
        if (isAuthLoading) return;

        if (!user) {
            setJourney(null);
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        const run = async () => {
            setIsLoading(true);
            setError(null);

            console.log('[useJourney] loading journey for user:', user.id);

            const { data, error: serviceError } = await journeyService.getJourneyByUserId(user.id);

            console.log('[useJourney] result:', { data, error: serviceError });

            if (cancelled) return;

            if (serviceError) {
                setError(serviceError);
                setIsLoading(false);
                return;
            }

            setJourney(data);
            setIsLoading(false);
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [user, isAuthLoading]);

    // ─── Actions ────────────────────────────────────────────────────────────────

    const createJourney = useCallback(
        async (request: CreateJourneyRequest): Promise<JourneyServiceError | null> => {
            if (!user) {
                return { message: 'You must be signed in to create a journey.' };
            }

            setIsLoading(true);
            setError(null);

            const { data, error: serviceError } = await journeyService.createJourney(
                user.id,
                request,
            );

            if (!mountedRef.current) return null;

            if (serviceError) {
                setError(serviceError);
                setIsLoading(false);
                return serviceError;
            }

            setJourney(data);
            setIsLoading(false);
            return null;
        },
        [user],
    );

    const updateJourney = useCallback(
        async (request: UpdateJourneyRequest): Promise<JourneyServiceError | null> => {
            if (!journey) {
                return { message: 'No journey to update.' };
            }

            setIsLoading(true);
            setError(null);

            const { data, error: serviceError } = await journeyService.updateJourney(
                journey.id,
                request,
            );

            if (!mountedRef.current) return null;

            if (serviceError) {
                setError(serviceError);
                setIsLoading(false);
                return serviceError;
            }

            setJourney(data);
            setIsLoading(false);
            return null;
        },
        [journey],
    );

    const deleteJourney = useCallback(async (): Promise<JourneyServiceError | null> => {
        if (!journey) {
            return { message: 'No journey to delete.' };
        }

        setIsLoading(true);
        setError(null);

        const { error: serviceError } = await journeyService.deleteJourney(journey.id);

        if (!mountedRef.current) return null;

        if (serviceError) {
            setError(serviceError);
            setIsLoading(false);
            return serviceError;
        }

        setJourney(null);
        setIsLoading(false);
        return null;
    }, [journey]);

    const refreshJourney = useCallback(async (): Promise<void> => {
        if (!user) return;
        await loadJourney(user.id);
    }, [user, loadJourney]);

    // ─── Return ──────────────────────────────────────────────────────────────────

    return {
        journey,
        isLoading,
        error,
        createJourney,
        updateJourney,
        deleteJourney,
        refreshJourney,
    };
}
