/**
 * AnalysisService
 *
 * The single layer that reads and writes analysis snapshot records in Supabase.
 * No UI logic, no navigation, no React hooks, no toast notifications.
 * All callers receive a typed { data, error } result — they decide what to do.
 */

import { supabase } from "@/lib/supabase";
import type { 
  AnalysisSnapshot, 
  CreateAnalysisSnapshotRequest, 
  UpdateAnalysisSnapshotRequest 
} from "../types/analysis.types";

// ─── Result envelope ──────────────────────────────────────────────────────────

export interface AnalysisServiceError {
  message: string;
  code?: string;
}

export interface AnalysisResult<T = void> {
  data: T | null;
  error: AnalysisServiceError | null;
}

// ─── Error normaliser ─────────────────────────────────────────────────────────

/**
 * Converts any thrown value into a consistent AnalysisServiceError.
 * Handles Supabase PostgrestError objects (have .message + .code),
 * native Error instances, and unknown primitives.
 */
function normalizeAnalysisError(err: unknown): AnalysisServiceError {
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

const TABLE = "analysis_snapshots" as const;

// ─── Service interface ────────────────────────────────────────────────────────

export interface IAnalysisService {
  /**
   * Insert a new analysis snapshot.
   * Returns the created AnalysisSnapshot on success.
   */
  createSnapshot(request: CreateAnalysisSnapshotRequest): Promise<AnalysisResult<AnalysisSnapshot>>;

  /**
   * Fetch the most recent analysis snapshot for a resume version.
   * Returns null data (not an error) when no snapshot exists yet.
   */
  getLatestSnapshotByResumeVersionId(resumeVersionId: string): Promise<AnalysisResult<AnalysisSnapshot>>;

  /**
   * Fetch every analysis snapshot for a resume version, newest first.
   * Returns an empty array (not an error) when no snapshots exist yet.
   */
  getAllSnapshotsByResumeVersionId(resumeVersionId: string): Promise<AnalysisResult<AnalysisSnapshot[]>>;

  /**
   * Update an existing analysis snapshot (e.g. after AI processing).
   * Returns the updated AnalysisSnapshot on success.
   */
  updateSnapshot(id: string, request: UpdateAnalysisSnapshotRequest): Promise<AnalysisResult<AnalysisSnapshot>>;

  /**
   * Fetch a single analysis snapshot by its id.
   * Returns null data (not an error) when no snapshot with that id exists.
   */
  getSnapshotById(id: string): Promise<AnalysisResult<AnalysisSnapshot>>;

  /**
   * Permanently delete an analysis snapshot by its id.
   * Returns void data on success.
   */
  deleteSnapshot(id: string): Promise<AnalysisResult>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

class AnalysisService implements IAnalysisService {
  async createSnapshot(
    request: CreateAnalysisSnapshotRequest,
  ): Promise<AnalysisResult<AnalysisSnapshot>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(request)
        .select()
        .single();

      if (error) {
        return { data: null, error: normalizeAnalysisError(error) };
      }

      return { data: data as AnalysisSnapshot, error: null };
    } catch (err) {
      return { data: null, error: normalizeAnalysisError(err) };
    }
  }

  async getLatestSnapshotByResumeVersionId(
    resumeVersionId: string,
  ): Promise<AnalysisResult<AnalysisSnapshot>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("resume_version_id", resumeVersionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: null, error: normalizeAnalysisError(error) };
      }

      return { data: (data as AnalysisSnapshot) ?? null, error: null };
    } catch (err) {
      return { data: null, error: normalizeAnalysisError(err) };
    }
  }

  async getAllSnapshotsByResumeVersionId(
    resumeVersionId: string,
  ): Promise<AnalysisResult<AnalysisSnapshot[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("resume_version_id", resumeVersionId)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: normalizeAnalysisError(error) };
      }

      return { data: (data as AnalysisSnapshot[]) ?? [], error: null };
    } catch (err) {
      return { data: null, error: normalizeAnalysisError(err) };
    }
  }

  async updateSnapshot(
    id: string,
    request: UpdateAnalysisSnapshotRequest,
  ): Promise<AnalysisResult<AnalysisSnapshot>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .update(request)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return { data: null, error: normalizeAnalysisError(error) };
      }

      return { data: data as AnalysisSnapshot, error: null };
    } catch (err) {
      return { data: null, error: normalizeAnalysisError(err) };
    }
  }

  async getSnapshotById(
    id: string,
  ): Promise<AnalysisResult<AnalysisSnapshot>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        return { data: null, error: normalizeAnalysisError(error) };
      }

      return { data: (data as AnalysisSnapshot) ?? null, error: null };
    } catch (err) {
      return { data: null, error: normalizeAnalysisError(err) };
    }
  }

  async deleteSnapshot(id: string): Promise<AnalysisResult> {
    try {
      const { error } = await supabase.from(TABLE).delete().eq("id", id);

      if (error) {
        return { data: null, error: normalizeAnalysisError(error) };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: normalizeAnalysisError(err) };
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const analysisService: IAnalysisService = new AnalysisService();
