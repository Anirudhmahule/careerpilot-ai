import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { resumeService } from '../services/resume.service';
import { storageService } from '../services/storage.service';
import type { ResumeServiceError } from '../services/resume.service';
import type { StorageServiceError } from '../services/storage.service';
import type { ResumeVersion } from '../types/resume.types';

// ─── Public hook return type ──────────────────────────────────────────────────

/**
 * A unified error shape exposed by the hook.
 * Both services use the same { message, code? } structure, so a single
 * alias covers both — no runtime conversion needed.
 */
export type ResumeHookError = ResumeServiceError | StorageServiceError;

export interface UseResumeReturn {
    /** The most recently uploaded resume version, or null if none exists. */
    latestResume: ResumeVersion | null;
    /** All resume versions for the user, newest first. */
    resumes: ResumeVersion[];
    /** True while the initial load or any action is in-flight. */
    isLoading: boolean;
    /** The last error from a load or action, or null if everything is fine. */
    error: ResumeHookError | null;
    /**
     * Upload a PDF file and persist its metadata.
     * Handles partial-failure rollback automatically:
     * - If the storage upload fails, no DB write is attempted.
     * - If the DB insert fails, the orphaned storage file is deleted.
     * Returns an error on failure, null on success.
     */
    uploadResume(file: File, journeyId: string): Promise<ResumeHookError | null>;
    /**
     * Delete a resume version from both storage and the database.
     * Only deletes the DB record if the storage delete succeeds.
     * Returns an error on failure, null on success.
     */
    deleteResume(resumeId: string, storagePath: string): Promise<ResumeHookError | null>;
    /** Manually re-fetch all resume versions from the database. */
    refreshResumes(): Promise<void>;
    /** Generate a short-lived download URL for a resume file. */
    getDownloadUrl(storagePath: string): Promise<string | null>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useResume(): UseResumeReturn {
    const { user, isLoading: isAuthLoading } = useAuth();

    const [latestResume, setLatestResume] = useState<ResumeVersion | null>(null);
    const [resumes, setResumes] = useState<ResumeVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<ResumeHookError | null>(null);

    // mountedRef guards imperative action callbacks that can't rely on a
    // per-effect cancelled flag (same pattern as useJourney).
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // ─── Load ────────────────────────────────────────────────────────────────────

    const loadResumes = useCallback(async (userId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        const [latestResult, allResult] = await Promise.all([
            resumeService.getLatestResumeByUserId(userId),
            resumeService.getAllResumesByUserId(userId),
        ]);

        if (!mountedRef.current) return;

        if (latestResult.error) {
            setError(latestResult.error);
            setIsLoading(false);
            return;
        }

        if (allResult.error) {
            setError(allResult.error);
            setIsLoading(false);
            return;
        }

        setLatestResume(latestResult.data);
        setResumes(allResult.data ?? []);
        setIsLoading(false);
    }, []);

    // Auto-load once auth has resolved and a user is present.
    useEffect(() => {
        if (isAuthLoading) return;

        if (!user) {
            setLatestResume(null);
            setResumes([]);
            setIsLoading(false);
            return;
        }

        void loadResumes(user.id);
    }, [user, isAuthLoading, loadResumes]);

    // ─── Actions ─────────────────────────────────────────────────────────────────

    const uploadResume = useCallback(
        async (file: File, journeyId: string): Promise<ResumeHookError | null> => {
            if (!user) {
                return { message: 'You must be signed in to upload a resume.' };
            }

            setIsLoading(true);
            setError(null);

            // Step 1: Upload the PDF to Supabase Storage.
            const { data: storagePath, error: storageError } =
                await storageService.uploadResumeFile(file, user.id, journeyId);

            if (!mountedRef.current) return null;

            if (storageError) {
                setError(storageError);
                setIsLoading(false);
                return storageError;
            }

            // Step 2: Persist the metadata in the database.
            const { data: newVersion, error: dbError } = await resumeService.uploadResume(
                user.id,
                {
                    journey_id: journeyId,
                    file_name: file.name,
                    storage_path: storagePath!,
                    file_size: file.size,
                },
            );

            if (!mountedRef.current) return null;

            if (dbError) {
                // Partial-failure rollback: remove the orphaned storage file so
                // the bucket stays in sync with the database.
                await storageService.deleteResumeFile(storagePath!);

                setError(dbError);
                setIsLoading(false);
                return dbError;
            }

            // Step 3: Update local state without a full page refresh.
            setLatestResume(newVersion);
            setResumes((prev) => [newVersion!, ...prev]);
            setIsLoading(false);
            return null;
        },
        [user],
    );

    const deleteResume = useCallback(
        async (resumeId: string, storagePath: string): Promise<ResumeHookError | null> => {
            if (!user) {
                return {
                    message: "You must be signed in to delete a resume.",
                };
            }
            setIsLoading(true);
            setError(null);

            // Step 1: Delete the file from Supabase Storage.
            const { error: storageError } = await storageService.deleteResumeFile(storagePath);

            if (!mountedRef.current) return null;

            if (storageError) {
                setError(storageError);
                setIsLoading(false);
                return storageError;
            }

            // Step 2: Only remove the DB record once storage deletion succeeds.
            // TODO:
            // Storage deletion and database deletion are performed separately.
            // If the database delete fails after storage succeeds, the metadata row
            // becomes orphaned. Consider moving deletion into a server-side endpoint
            // or Supabase Edge Function so both operations can be coordinated.
            const { error: dbError } = await resumeService.deleteResume(resumeId);

            if (!mountedRef.current) return null;

            if (dbError) {
                setError(dbError);
                setIsLoading(false);
                return dbError;
            }

            // Step 3: Reload from the database so latestResume always reflects
            // the true newest remaining version — not a client-side guess.
            // This also picks up any server-side side-effects (e.g. version
            // renumbering triggers) without duplicating state logic here.
            await loadResumes(user.id);
            return null;
        },
        [user, loadResumes],
    );

    const refreshResumes = useCallback(async (): Promise<void> => {
        if (!user) return;
        await loadResumes(user.id);
    }, [user, loadResumes]);

    const getDownloadUrl = useCallback(
        async (storagePath: string): Promise<string | null> => {
            setError(null);
            const { data, error: storageError } = await storageService.getSignedResumeUrl(storagePath);
            if (storageError) {
                setError(storageError);
                return null;
            }
            return data;
        },
        [],
    );

    // ─── Return ──────────────────────────────────────────────────────────────────

    return {
        latestResume,
        resumes,
        isLoading,
        error,
        uploadResume,
        deleteResume,
        refreshResumes,
        getDownloadUrl,
    };
}
