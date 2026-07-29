/**
 * SignupPage
 *
 * Renders the two-column AuthCard shell with SignupForm inside.
 * Handles two post-signup outcomes:
 *   1. Auto-confirmed  → navigate to /app/dashboard immediately
 *   2. Email required  → show confirmation state (no navigation needed)
 */

import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthCard } from '../components/AuthCard';
import { SignupForm } from '../components/SignupForm';

export function SignupPage() {
    const navigate = useNavigate();
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

    function handleSuccess(needsEmailConfirmation: boolean) {
        if (needsEmailConfirmation) {
            setAwaitingConfirmation(true);
        } else {
            void navigate({ to: '/app/dashboard', replace: true });
        }
    }

    // ── Email confirmation state ───────────────────────────────────────────────
    if (awaitingConfirmation) {
        return (
            <AuthCard
                title="Check your inbox"
                subtitle="We sent a confirmation link to your email address."
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-10 text-center">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-success/10">
                            <CheckCircle2
                                className="h-6 w-6 text-success"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                                Confirmation email sent
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Click the link in the email to activate your account, then
                                sign in below.
                            </p>
                        </div>
                    </div>

                    <Button asChild size="lg" className="w-full">
                        <Link to="/auth/login">
                            Go to sign in
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                </div>
            </AuthCard>
        );
    }

    // ── Registration form ─────────────────────────────────────────────────────
    return (
        <AuthCard
            title="Create your account"
            subtitle="Start navigating your career with precision."
        >
            <SignupForm onSuccess={handleSuccess} />

            <p className="mt-6 text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link
                    to="/auth/login"
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                    Sign in
                </Link>
            </p>
        </AuthCard>
    );
}
