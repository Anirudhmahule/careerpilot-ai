/**
 * AuthProvider
 *
 * Single source of truth for authentication state across the entire app.
 *
 * Responsibilities:
 *  - Hydrate the persisted session once on mount (getSession — no network call)
 *  - Register exactly ONE auth state subscription for the lifetime of the app
 *  - Expose state + actions through AuthContext
 *
 * Rules:
 *  - This file never imports Supabase directly — all calls go through AuthService
 *  - Components must never be rendered outside <AuthProvider>
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import type { AuthState, AuthServiceError, AuthSession, AuthUser } from '../types';

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AuthContextValue extends AuthState {
    signIn(email: string, password: string): Promise<AuthServiceError | null>;
    signUp(email: string, password: string): Promise<AuthServiceError | null>;
    signOut(): Promise<AuthServiceError | null>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);
AuthContext.displayName = 'AuthContext';

// ─── Provider ────────────────────────────────────────────────────────────────

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        isLoading: true, // true until the initial session hydration resolves
        isAuthenticated: false,
    });

    // Guard against state updates on an unmounted provider (e.g. hot-reload edge cases)
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // ─── Session hydration + single subscription ──────────────────────────────

    useEffect(() => {
        // Step 1 — Read the persisted session from localStorage synchronously.
        // This avoids a flicker: the app knows it's authenticated before the first
        // auth state change event fires.
        authService.getSession().then(({ data: session }) => {
            if (!mountedRef.current) return;
            applySession(session);
        }).catch(() => {
            if (!mountedRef.current) return;
            applySession(null);
        });

        // Step 2 — Subscribe to all future auth events (sign-in, sign-out,
        // token refresh, password recovery, etc.) via AuthService.
        // AuthService owns the Supabase subscription — this file never touches
        // the Supabase client directly.
        const unsubscribe = authService.subscribeToAuthChanges((session) => {
            if (!mountedRef.current) return;
            applySession(session);
        });

        return () => {
            unsubscribe();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Helpers ─────────────────────────────────────────────────────────────

    function applySession(session: AuthSession | null) {
        setState({
            user: session?.user ?? null,
            session,
            isLoading: false,
            isAuthenticated: session !== null,
        });
    }

    // ─── Actions ─────────────────────────────────────────────────────────────
    //
    // Each action sets isLoading while the request is in-flight, then clears it.
    // On success, onAuthStateChange fires and applySession updates the rest of
    // the state — so we never manually set user/session/isAuthenticated here.

    const signIn = useCallback(
        async (email: string, password: string): Promise<AuthServiceError | null> => {
            setState((prev) => ({ ...prev, isLoading: true }));
            const { error } = await authService.signIn(email, password);
            if (mountedRef.current && error) {
                // Only clear the loading flag on failure; success is handled by the
                // onAuthStateChange listener which calls applySession.
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
        if (mountedRef.current && error) {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
        return error;
    }, []);

    // ─── Context value ────────────────────────────────────────────────────────

    const value: AuthContextValue = {
        ...state,
        signIn,
        signUp,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Raw context accessor (used only by useAuth) ──────────────────────────────

/**
 * useAuthContext
 *
 * Low-level hook that returns the raw AuthContextValue.
 * Throws a descriptive error if called outside <AuthProvider> so misconfigured
 * trees fail loudly at development time.
 *
 * Prefer useAuth() in application code.
 */
export function useAuthContext(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (ctx === null) {
        throw new Error(
            'useAuthContext must be used within <AuthProvider>. ' +
            'Make sure <AuthProvider> wraps your component tree in the root layout.',
        );
    }
    return ctx;
}

// ─── Selector hooks (stable, zero-overhead) ──────────────────────────────────

/** Returns only the current user. Causes no re-renders from session/loading changes. */
export function useAuthUser(): AuthUser | null {
    return useAuthContext().user;
}

/** Returns only the current session. */
export function useAuthSession(): AuthSession | null {
    return useAuthContext().session;
}

/** Returns true while the initial session is being resolved. */
export function useAuthIsLoading(): boolean {
    return useAuthContext().isLoading;
}
