/**
 * AuthService
 *
 * The single layer that talks to Supabase auth.
 * No UI component should import from @supabase/supabase-js directly —
 * everything flows through this service.
 */

import { supabase } from '@/lib/supabase';
import type {
    AuthResult,
    AuthUser,
    AuthSession,
    AuthServiceError,
} from '../types';
import { normalizeAuthError } from '../types';

// ─── Service interface ────────────────────────────────────────────────────────

export interface IAuthService {
    signUp(email: string, password: string): Promise<AuthResult<AuthUser>>;
    signIn(email: string, password: string): Promise<AuthResult<AuthSession>>;
    signOut(): Promise<AuthResult>;
    getCurrentUser(): Promise<AuthResult<AuthUser>>;
    getSession(): Promise<AuthResult<AuthSession>>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

class AuthService implements IAuthService {
    /**
     * Register a new user with email + password.
     * Returns the created user, or an error if the address is already taken
     * or the password does not meet Supabase's policy.
     */
    async signUp(email: string, password: string): Promise<AuthResult<AuthUser>> {
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                return { data: null, error: normalizeAuthError(error) };
            }

            return { data: data.user ?? null, error: null };
        } catch (err) {
            return { data: null, error: normalizeAuthError(err) };
        }
    }

    /**
     * Sign in an existing user with email + password.
     * Returns the active session on success.
     */
    async signIn(
        email: string,
        password: string,
    ): Promise<AuthResult<AuthSession>> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { data: null, error: normalizeAuthError(error) };
            }

            return { data: data.session ?? null, error: null };
        } catch (err) {
            return { data: null, error: normalizeAuthError(err) };
        }
    }

    /**
     * Sign out the current user and clear the local session.
     */
    async signOut(): Promise<AuthResult> {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                return { data: null, error: normalizeAuthError(error) };
            }

            return { data: null, error: null };
        } catch (err) {
            return { data: null, error: normalizeAuthError(err) };
        }
    }

    /**
     * Return the currently authenticated user, or null if unauthenticated.
     * Uses getUser() which re-validates the JWT with Supabase servers.
     */
    async getCurrentUser(): Promise<AuthResult<AuthUser>> {
        try {
            const { data, error } = await supabase.auth.getUser();

            if (error) {
                // A "user not found" / session-missing error is not exceptional — just unauthenticated
                if (this.isSessionMissingError(error.message)) {
                    return { data: null, error: null };
                }
                return { data: null, error: normalizeAuthError(error) };
            }

            return { data: data.user ?? null, error: null };
        } catch (err) {
            return { data: null, error: normalizeAuthError(err) };
        }
    }

    /**
     * Return the current session from local storage (no network call).
     * Prefer getCurrentUser() when you need a server-validated identity.
     */
    async getSession(): Promise<AuthResult<AuthSession>> {
        try {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                return { data: null, error: normalizeAuthError(error) };
            }

            return { data: data.session ?? null, error: null };
        } catch (err) {
            return { data: null, error: normalizeAuthError(err) };
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    private isSessionMissingError(message: string): boolean {
        const lower = message.toLowerCase();
        return (
            lower.includes('auth session missing') ||
            lower.includes('no session') ||
            lower.includes('not authenticated')
        );
    }
}

// ─── Singleton export ────────────────────────────────────────────────────────

export const authService: IAuthService = new AuthService();

// Named error type re-export for consumers that only need this file
export type { AuthServiceError };
