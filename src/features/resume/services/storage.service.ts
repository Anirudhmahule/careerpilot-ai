/**
 * StorageService
 *
 * The single layer responsible for all Supabase Storage interactions
 * related to resume files (bucket: resume-files).
 * No UI logic, no navigation, no React hooks, no toast notifications.
 * All callers receive a typed { data, error } result — they decide what to do.
 */

import { supabase } from "@/lib/supabase";

// ─── Storage bucket constant ───────────────────────────────────────────────────

const BUCKET = "resume-files" as const;

/** Signed URL validity window in seconds (1 hour). */
const SIGNED_URL_EXPIRES_IN = 3600 as const;

// ─── Result envelope ──────────────────────────────────────────────────────────

export interface StorageServiceError {
  message: string;
  code?: string;
}

export interface StorageResult<T = void> {
  data: T | null;
  error: StorageServiceError | null;
}

// ─── Error normaliser ─────────────────────────────────────────────────────────

/**
 * Converts any thrown value into a consistent StorageServiceError.
 * Handles Supabase StorageError objects (have .message + .error),
 * native Error instances, and unknown primitives.
 */
function normalizeStorageError(err: unknown): StorageServiceError {
  if (err !== null && typeof err === "object") {
    const candidate = err as Record<string, unknown>;
    const message =
      typeof candidate["message"] === "string"
        ? candidate["message"]
        : "An unexpected storage error occurred. Please try again.";
    // Supabase StorageError surfaces the HTTP status as `.error` (a string)
    // and also sometimes exposes `.statusCode`. Normalise both into `code`.
    const code =
      typeof candidate["code"] === "string"
        ? candidate["code"]
        : typeof candidate["error"] === "string"
          ? candidate["error"]
          : typeof candidate["statusCode"] === "string"
            ? candidate["statusCode"]
            : undefined;
    return { message, code };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: "An unexpected storage error occurred. Please try again." };
}

// ─── Path builder ──────────────────────────────────────────────────────────────

/**
 * Constructs the canonical storage path for a resume file.
 *
 * Convention: `{userId}/{journeyId}/{timestamp}_{filename}`
 *
 * Example: `8fa2.../91bd.../174932842_resume.pdf`
 */
function buildStoragePath(file: File, userId: string, journeyId: string): string {
  const timestamp = Date.now();
  // Sanitise the original filename:
  // 1. Trim leading/trailing whitespace
  // 2. Replace spaces with underscores
  // 3. Remove characters that are not letters, numbers, underscores, hyphens, or periods.
  const trimmed = file.name.trim();
  const spacesToUnderscores = trimmed.replace(/\s+/g, "_");
  const sanitisedName = spacesToUnderscores.replace(/[^a-zA-Z0-9_\-\.]/g, "");
  return `${userId}/${journeyId}/${timestamp}_${sanitisedName}`;
}

// ─── Service interface ────────────────────────────────────────────────────────

export interface IStorageService {
  /**
   * Upload a PDF file to the `resume-files` bucket.
   * Returns the storage path on success so callers can persist it in the DB.
   *
   * Storage path convention: `{userId}/{journeyId}/{timestamp}_{filename}.pdf`
   */
  uploadResumeFile(
    file: File,
    userId: string,
    journeyId: string,
  ): Promise<StorageResult<string>>;

  /**
   * Permanently remove a file from the `resume-files` bucket.
   * Returns void data on success.
   */
  deleteResumeFile(storagePath: string): Promise<StorageResult>;

  /**
   * Generate a short-lived signed URL for a private resume file.
   * The URL is valid for {@link SIGNED_URL_EXPIRES_IN} seconds (1 hour).
   * Returns the signed URL string on success.
   */
  getSignedResumeUrl(storagePath: string): Promise<StorageResult<string>>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

class StorageService implements IStorageService {
  /**
   * Upload `file` to the `resume-files` bucket under the path derived from
   * `userId` and `journeyId`.
   * Returns the full storage path string so the caller can store it in the DB.
   */
  async uploadResumeFile(
    file: File,
    userId: string,
    journeyId: string,
  ): Promise<StorageResult<string>> {
    try {
      if (file.type !== "application/pdf") {
        return {
          data: null,
          error: { message: "Only PDF files are allowed." },
        };
      }

      if (file.size === 0) {
        return {
          data: null,
          error: { message: "Cannot upload an empty file." },
        };
      }

      const storagePath = buildStoragePath(file, userId, journeyId);

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, {
          contentType: "application/pdf",
          // Prevent accidental overwrites — every upload gets a unique path
          // via the timestamp prefix, so upsert is intentionally false.
          upsert: false,
        });

      if (error) {
        return { data: null, error: normalizeStorageError(error) };
      }

      return { data: storagePath, error: null };
    } catch (err) {
      return { data: null, error: normalizeStorageError(err) };
    }
  }

  /**
   * Remove the file at `storagePath` from the `resume-files` bucket.
   * Supabase's `remove` accepts an array; a single-element array is passed
   * for a targeted delete.
   */
  async deleteResumeFile(storagePath: string): Promise<StorageResult> {
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);

      if (error) {
        return { data: null, error: normalizeStorageError(error) };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: normalizeStorageError(err) };
    }
  }

  /**
   * Create a signed URL for `storagePath` that is valid for
   * {@link SIGNED_URL_EXPIRES_IN} seconds.
   * Use this instead of a public URL because the bucket is private.
   */
  async getSignedResumeUrl(storagePath: string): Promise<StorageResult<string>> {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN);

      if (error) {
        return { data: null, error: normalizeStorageError(error) };
      }

      return { data: data.signedUrl, error: null };
    } catch (err) {
      return { data: null, error: normalizeStorageError(err) };
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const storageService: IStorageService = new StorageService();
