import { useCallback, useEffect, useRef, useState } from 'react';
import { validationService } from '../services/validation.service';
import type { ValidationServiceError } from '../services/validation.service';
import type {
    ValidationGenerationRow,
    ValidationQuestionRow,
    MutateValidationAnswerRequest,
} from '../types/validation.types';

// ─── Public hook return type ──────────────────────────────────────────────────

export interface UseValidationReturn {
    /** The latest validation generation row for this snapshot, or null. */
    generation: ValidationGenerationRow | null;
    /** The questions for the current completed generation, in order. */
    questions: ValidationQuestionRow[];
    /** True while any load or action is in-flight. */
    isLoading: boolean;
    /** True while the generate action is specifically running. */
    isGenerating: boolean;
    /** The last error from a load or action, or null. */
    error: ValidationServiceError | null;
    /** Derived: true when all questions have been answered by the current user. */
    isComplete: boolean;
    /**
     * Trigger the AI edge function to generate validation questions for this
     * snapshot + role. No-ops if snapshotId or roleId is missing.
     * Returns an error on failure, null on success.
     */
    generateQuestions(): Promise<ValidationServiceError | null>;
    /**
     * Submit or update a single validation answer.
     * Automatically refreshes the question list on success.
     * Returns an error on failure, null on success.
     */
    submitAnswer(request: MutateValidationAnswerRequest): Promise<ValidationServiceError | null>;
    /** Manually re-fetch generation and questions. */
    refresh(): Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages the full validation lifecycle for a single analysis snapshot + role.
 *
 * @param snapshotId - The analysis_snapshot_id to validate against.
 * @param roleId     - The role_id (UUID) required by the edge function.
 */
export function useValidation(
    snapshotId?: string,
    roleId?: string,
): UseValidationReturn {
    const [generation, setGeneration] = useState<ValidationGenerationRow | null>(null);
    const [questions, setQuestions] = useState<ValidationQuestionRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<ValidationServiceError | null>(null);

    // mountedRef guards action callbacks that are called imperatively and
    // cannot use a per-effect cancelled flag.
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // ─── Load ─────────────────────────────────────────────────────────────────

    const loadData = useCallback(async (sid: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        // 1. Fetch the latest generation for this snapshot.
        const { data: gen, error: genError } =
            await validationService.getLatestGeneration(sid);

        if (!mountedRef.current) return;

        if (genError) {
            setError(genError);
            setIsLoading(false);
            return;
        }

        setGeneration(gen);

        // 2. If generation is completed, fetch its questions + answers.
        if (gen && gen.status === 'completed') {
            const { data: qs, error: qError } =
                await validationService.getQuestions(gen.id);

            if (!mountedRef.current) return;

            if (qError) {
                setError(qError);
                setIsLoading(false);
                return;
            }

            setQuestions(qs ?? []);
        } else {
            setQuestions([]);
        }

        setIsLoading(false);
    }, []);

    // Auto-load whenever snapshotId changes.
    useEffect(() => {
        if (!snapshotId) {
            setGeneration(null);
            setQuestions([]);
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        const run = async () => {
            setIsLoading(true);
            setError(null);

            const { data: gen, error: genError } =
                await validationService.getLatestGeneration(snapshotId);

            if (cancelled) return;

            if (genError) {
                setError(genError);
                setIsLoading(false);
                return;
            }

            setGeneration(gen);

            if (gen && gen.status === 'completed') {
                const { data: qs, error: qError } =
                    await validationService.getQuestions(gen.id);

                if (cancelled) return;

                if (qError) {
                    setError(qError);
                    setIsLoading(false);
                    return;
                }

                setQuestions(qs ?? []);
            } else {
                setQuestions([]);
            }

            setIsLoading(false);
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [snapshotId]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const generateQuestions = useCallback(async (): Promise<ValidationServiceError | null> => {
        if (!snapshotId || !roleId) {
            return { message: 'Snapshot ID and role ID are required to generate questions.' };
        }

        setIsGenerating(true);
        setError(null);

        const { error: serviceError } = await validationService.generateQuestions({
            analysisSnapshotId: snapshotId,
            roleId,
        });

        if (!mountedRef.current) return null;

        if (serviceError) {
            setError(serviceError);
            setIsGenerating(false);
            return serviceError;
        }

        // Reload data to pick up the new generation + questions.
        await loadData(snapshotId);

        if (!mountedRef.current) return null;
        setIsGenerating(false);
        return null;
    }, [snapshotId, roleId, loadData]);

    const submitAnswer = useCallback(
        async (request: MutateValidationAnswerRequest): Promise<ValidationServiceError | null> => {
            const { error: serviceError } = await validationService.submitAnswer(request);

            if (!mountedRef.current) return null;

            if (serviceError) {
                setError(serviceError);
                return serviceError;
            }

            // Refresh questions so the answered state is reflected in the UI.
            if (snapshotId && generation?.id) {
                const { data: qs, error: qError } =
                    await validationService.getQuestions(generation.id);

                if (!mountedRef.current) return null;

                if (!qError && qs) {
                    setQuestions(qs);
                }
            }

            return null;
        },
        [snapshotId, generation],
    );

    const refresh = useCallback(async (): Promise<void> => {
        if (!snapshotId) return;
        await loadData(snapshotId);
    }, [snapshotId, loadData]);

    // ─── Derived state ────────────────────────────────────────────────────────

    const isComplete =
        questions.length > 0 &&
        questions.every((q) => q.validation_answers.length > 0);

    // ─── Return ───────────────────────────────────────────────────────────────

    return {
        generation,
        questions,
        isLoading,
        isGenerating,
        error,
        isComplete,
        generateQuestions,
        submitAnswer,
        refresh,
    };
}
