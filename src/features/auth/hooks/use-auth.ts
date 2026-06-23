/**
 * useAuth
 *
 * Provides reactive auth state (user, session, isLoading, isAuthenticated)
 * and action helpers (signIn, signUp, signOut) to any component.
 *
 * Session persistence is handled automatically: Supabase persists the JWT
 * in localStorage and this hook re-hydrates it on mount via onAuthStateChange.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '../services/auth.service';
import type { AuthState, AuthServiceError, AuthUser, AuthSession } from '../types';

// ─── Public hook API ──────────────────────────────────────────────────────────

export interface UseAuthReturn extends AuthState {
    /** Sign in with email + password. Returns an error string on failure. */
    signIn(email: string, password: string): Promise<AuthServiceError | null>;
    /** Register with email + password. Returns an error string on failure. */
    signUp(email: string, password: string): Promise<AuthServiceError | null>;
    /** Sign out the current user. */
    signOut(): Promise<AuthServiceError | null>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): UseAuthReturn {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        isLoading: true,    // start true — we don't know the session yet
        isAuthenticated: false,
    });

    // Track mount status to avoid state updates after unmount
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // ─── Session hydration & listener ──────────────────────────────────────────

    useEffect(() => {
        // 1. Load the persisted session synchronously from storage
        void authService.getSession().then(({ data: session }) => {
            if (!mountedRef.current) return;
            setState({
                user: session?.user ?? null,
                session,
                isLoading: false,
                isAuthenticated: session !== null,
            });
        });

        // 2. Subscribe to future auth state changes (sign-in, sign-out, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mountedRef.current) return;
            setState({
                user: session?.user ?? null,
                session,
                isLoading: false,
                isAuthenticated: session !== null,
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // ─── Actions ───────────────────────────────────────────────────────────────

    const signIn = useCallback(
        async (email: string, password: string): Promise<AuthServiceError | null> => {
            setState((prev) => ({ ...prev, isLoading: true }));
            const { error } = await authService.signIn(email, password);
            // onAuthStateChange will update the session state on success
            if (mountedRef.current) {
                setState((prev) => ({ ...prev, isLoading: false }));
            }
            return error;
        },
        [],
    );

    const signUp = useCallback(
        async (email: string, password: string): Promise<AuthServiceError | null> => {
            setState((prev) => ({ ...prev, isLoading: true }));
            const { error } = await authService.signUp(email, password);
            if (mountedRef.current) {
                setState((prev) => ({ ...prev, isLoading: false }));
            }
            return error;
        },
        [],
    );

    const signOut = useCallback(async (): Promise<AuthServiceError | null> => {
        setState((prev) => ({ ...prev, isLoading: true }));
        const { error } = await authService.signOut();
        // onAuthStateChange will clear the session state on success
        if (mountedRef.current) {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
        return error;
    }, []);

    return { ...state, signIn, signUp, signOut };
}

// ─── Selectors (lightweight derived hooks) ────────────────────────────────────

/** Returns only the current user — avoids re-renders from session/loading changes. */
export function useCurrentUser(): AuthUser | null {
    const { user } = useAuth();
    return user;
}

/** Returns only the current session. */
export function useSession(): AuthSession | null {
    const { session } = useAuth();
    return session;
}
