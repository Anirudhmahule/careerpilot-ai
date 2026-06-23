/**
 * LoginPage
 *
 * Renders the two-column AuthCard shell with LoginForm inside.
 * All form logic (validation, submission, error handling) lives in LoginForm.
 * Navigation on success happens here — the page owns routing, not the form.
 *
 * Reads the optional `redirect` search param (set by the /app beforeLoad guard
 * and by ProtectedRoute) so the user lands back on the page they were trying
 * to reach instead of always going to /app/dashboard.
 */

import { useNavigate, useSearch, Link } from '@tanstack/react-router';
import { AuthCard } from '../components/AuthCard';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
    const navigate = useNavigate();

    // `useSearch` is typed via the route's validateSearch schema.
    // Falls back gracefully when the param is absent.
    const search = useSearch({ from: '/auth/login' });
    const redirectTo = search.redirect ?? '/app/dashboard';

    function handleSuccess() {
        void navigate({ to: redirectTo, replace: true });
    }

    return (
        <AuthCard
            title="Welcome back"
            subtitle="Sign in to continue your journey."
        >
            <LoginForm onSuccess={handleSuccess} />

            <p className="mt-6 text-center text-xs text-muted-foreground">
                New here?{' '}
                <Link
                    to="/auth/signup"
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                    Create an account
                </Link>
            </p>
        </AuthCard>
    );
}
