/**
 * ResumeService
 *
 * The single layer that reads and writes resume version records in Supabase.
 * No UI logic, no navigation, no React hooks, no toast notifications.
 * All callers receive a typed { data, error } result — they decide what to do.
 */

import { supabase } from "@/lib/supabase";
import type { ResumeVersion, CreateResumeRequest } from "../types/resume.types";

// ─── Result envelope ──────────────────────────────────────────────────────────

export interface ResumeServiceError {
  message: string;
  code?: string;
}

export interface ResumeResult<T = void> {
  data: T | null;
  error: ResumeServiceError | null;
}

// ─── Error normaliser ─────────────────────────────────────────────────────────

/**
 * Converts any thrown value into a consistent ResumeServiceError.
 * Handles Supabase PostgrestError objects (have .message + .code),
 * native Error instances, and unknown primitives.
 */
function normalizeResumeError(err: unknown): ResumeServiceError {
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

// ─── Supabase table name ──────────────────────────────────────────────────────

const TABLE = "resume_versions" as const;

// ─── Service interface ────────────────────────────────────────────────────────

export interface IResumeService {
  /**
   * Insert a new resume version row for the given user.
   * Auto-increments version_number based on the user's existing versions.
   * Returns the created ResumeVersion on success.
   */
  uploadResume(userId: string, request: CreateResumeRequest): Promise<ResumeResult<ResumeVersion>>;

  /**
   * Fetch the most recent resume version for a user.
   * Returns null data (not an error) when the user has no resume yet.
   */
  getLatestResumeByUserId(userId: string): Promise<ResumeResult<ResumeVersion>>;

  /**
   * Fetch every resume version owned by a user, newest first.
   * Returns an empty array (not an error) when the user has no resumes yet.
   */
  getAllResumesByUserId(userId: string): Promise<ResumeResult<ResumeVersion[]>>;

  /**
   * Permanently delete a resume version by its id.
   * Returns void data on success.
   */
  deleteResume(resumeId: string): Promise<ResumeResult>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

class ResumeService implements IResumeService {
  /**
   * Insert a new resume version row.
   * Merges user_id and the next version_number into the row so callers
   * never touch those columns directly.
   */
  async uploadResume(
    userId: string,
    request: CreateResumeRequest,
  ): Promise<ResumeResult<ResumeVersion>> {
    try {
      const { data: latest, error: latestError } = await supabase
        .from(TABLE)
        .select("version_number")
        .eq("user_id", userId)
        .eq("journey_id", request.journey_id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        return { data: null, error: normalizeResumeError(latestError) };
      }

      const versionNumber = (latest?.version_number ?? 0) + 1;

      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...request, user_id: userId, version_number: versionNumber })
        .select()
        .single();

      if (error) {
        return { data: null, error: normalizeResumeError(error) };
      }

      return { data: data as ResumeVersion, error: null };
    } catch (err) {
      return { data: null, error: normalizeResumeError(err) };
    }
  }

  /**
   * Return the newest resume version owned by userId.
   * Returns { data: null, error: null } when no row exists — not an error.
   */
  async getLatestResumeByUserId(userId: string): Promise<ResumeResult<ResumeVersion>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: null, error: normalizeResumeError(error) };
      }

      return { data: (data as ResumeVersion) ?? null, error: null };
    } catch (err) {
      return { data: null, error: normalizeResumeError(err) };
    }
  }

  /**
   * Return all resume versions for userId, ordered newest first.
   * Supabase returns an empty array when no rows exist — not an error.
   */
  async getAllResumesByUserId(userId: string): Promise<ResumeResult<ResumeVersion[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("user_id", userId)
        .order("version_number", { ascending: false });

      if (error) {
        return { data: null, error: normalizeResumeError(error) };
      }

      return { data: (data as ResumeVersion[]) ?? [], error: null };
    } catch (err) {
      return { data: null, error: normalizeResumeError(err) };
    }
  }

  /**
   * Hard-delete a resume version row.
   * Returns { data: null, error: null } on success — callers check error
   * to determine outcome.
   */
  async deleteResume(resumeId: string): Promise<ResumeResult> {
    try {
      const { error } = await supabase.from(TABLE).delete().eq("id", resumeId);

      if (error) {
        return { data: null, error: normalizeResumeError(error) };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: normalizeResumeError(err) };
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const resumeService: IResumeService = new ResumeService();
