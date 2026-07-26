/**
 * ProtectedRoute
 *
 * Client-side auth guard component.
 *
 * Behaviour:
 *  - isLoading  → render the full-viewport loading screen (session not yet resolved)
 *  - !isAuthenticated → imperatively redirect to /auth/login, preserving the
 *    current path as a `redirect` search param for post-login return
 *  - isAuthenticated → render children
 *
 * TanStack Router compatibility:
 *  The /app route already has a beforeLoad server/loader guard as the primary
 *  protection layer. This component is the secondary, purely React-side guard.
 *  It is safe to compose both: beforeLoad runs first on navigation; this component
 *  handles any client-side state transitions that happen after the route is mounted
 *  (e.g. a session expiring mid-session without a page reload).
 *
 * Usage:
 *   // As a component wrapper (non-route usage):
 *   <ProtectedRoute>
 *     <SensitivePanel />
 *   </ProtectedRoute>
 *
 *   // As a route component (wrap Outlet):
 *   function AppLayout() {
 *     return (
 *       <ProtectedRoute>
 *         <Outlet />
 *       </ProtectedRoute>
 *     );
 *   }
 */

import { useEffect, type ReactNode } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../hooks/use-auth';
import { AuthLoadingScreen } from './AuthLoadingScreen';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
    children: ReactNode;
    /**
     * Path to redirect unauthenticated users to.
     * Defaults to /auth/login — override only when you need a different entry point.
     */
    redirectTo?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProtectedRoute({
    children,
    redirectTo = '/auth/login',
}: ProtectedRouteProps) {
    const { isLoading, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const currentPath = useRouterState({
        select: (s) => s.location.href,
    });

    useEffect(() => {
        // Wait until the auth provider has resolved the initial session.
        // Redirecting while isLoading is true would send the user to login even
        // if they have a valid persisted session that hasn't been read yet.
        if (isLoading) return;

        if (!isAuthenticated) {
            void navigate({
                to: redirectTo,
                search: { redirect: currentPath },
                replace: true,
            });
        }
    }, [isLoading, isAuthenticated, navigate, redirectTo, currentPath]);

    // ── Loading state ─────────────────────────────────────────────────────────
    // Show the full-viewport spinner while the session is being resolved.
    // This prevents a flash of the login redirect for users who ARE authenticated.
    if (isLoading) {
        return <AuthLoadingScreen />;
    }

    // ── Unauthenticated ───────────────────────────────────────────────────────
    // The useEffect above has already enqueued the redirect. Return null to
    // avoid rendering children — even for a single frame — before navigation
    // completes.
    if (!isAuthenticated) {
        return null;
    }

    // ── Authenticated ─────────────────────────────────────────────────────────
    return <>{children}</>;
}
