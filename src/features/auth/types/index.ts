import type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js';

// ─── Domain types ────────────────────────────────────────────────────────────

export type AuthUser = User;
export type AuthSession = Session;

export interface AuthResult<T = void> {
    data: T | null;
    error: AuthServiceError | null;
}

export interface AuthServiceError {
    message: string;
    code?: string;
}

// ─── Form types ───────────────────────────────────────────────────────────────

export interface LoginFormValues {
    email: string;
    password: string;
}

export interface SignupFormValues {
    email: string;
    password: string;
    confirmPassword: string;
}

// ─── Hook state ──────────────────────────────────────────────────────────────

export interface AuthState {
    user: AuthUser | null;
    session: AuthSession | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function normalizeAuthError(err: unknown): AuthServiceError {
    if (err && typeof err === 'object' && 'message' in err) {
        const supaError = err as SupabaseAuthError;
        return {
            message: supaError.message,
            code: 'code' in supaError ? String((supaError as unknown as Record<string, unknown>).code) : undefined,
        };
    }
    if (err instanceof Error) {
        return { message: err.message };
    }
    return { message: 'An unexpected error occurred. Please try again.' };
}
