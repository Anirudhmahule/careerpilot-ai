/**
 * useAuth
 *
 * Public API for consuming authentication state and actions.
 *
 * This hook is now a thin wrapper around AuthContext — it holds no local
 * state and registers no subscriptions. All state lives in <AuthProvider>.
 *
 * Usage:
 *   const { user, isLoading, signIn, signOut } = useAuth();
 */

import { useAuthContext } from '../providers/AuthProvider';
import type { AuthContextValue } from '../providers/AuthProvider';
import type { AuthUser, AuthSession } from '../types';

// Re-export the context shape so consumers can type against UseAuthReturn
// without importing from the provider directly.
export type UseAuthReturn = AuthContextValue;

/**
 * useAuth — primary hook for all auth state and actions.
 *
 * Throws if called outside <AuthProvider>.
 */
export function useAuth(): UseAuthReturn {
    return useAuthContext();
}

// ─── Focused selector hooks ───────────────────────────────────────────────────
// These prevent unnecessary re-renders in components that only need a slice
// of auth state.

/** Returns only the authenticated user, or null if unauthenticated. */
export function useCurrentUser(): AuthUser | null {
    return useAuthContext().user;
}

/** Returns only the current session, or null if unauthenticated. */
export function useSession(): AuthSession | null {
    return useAuthContext().session;
}
