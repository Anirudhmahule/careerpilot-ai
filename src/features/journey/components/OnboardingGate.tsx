/**
 * OnboardingGate
 *
 * Second-layer guard that runs after authentication is confirmed.
 *
 * Behaviour:
 *  - journey loading  → show loading screen (prevents flash of dashboard)
 *  - journey is null  → redirect to /app/journey/create (onboarding wizard)
 *  - journey exists   → render children (allow access to all /app routes)
 *
 * Loop prevention:
 *  /app/journey/create is exempted so the wizard doesn't redirect to itself
 *  while the user is filling it in (journey is null until they submit).
 *
 * Placement:
 *  Rendered inside AppShell, already wrapped by ProtectedRoute.
 *  Execution order:  beforeLoad → ProtectedRoute (auth) → OnboardingGate (journey)
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useJourney } from '../hooks/useJourney';
import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen';

// The actual URL path (not the route id) that bypasses the onboarding check.
const WIZARD_PATH = '/app/journey/create';

interface OnboardingGateProps {
    children: ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
    const { journey, isLoading, refreshJourney } = useJourney();
    const navigate = useNavigate();
    const currentPath = useRouterState({ select: (s) => s.location.pathname });
    const [verificationDone, setVerificationDone] = useState(false);

    const isOnWizard = currentPath.startsWith(WIZARD_PATH);

    console.log('[OnboardingGate]', {
        isLoading,
        hasJourney: journey !== null,
        journey,
        pathname: window.location.pathname,
    });

    useEffect(() => {
        if (isLoading) return;       // wait for the journey fetch to settle
        if (isOnWizard) return;      // already on the wizard — don't loop
        if (journey !== null) return; // journey exists — allow through

        if (verificationDone) {
            // Re-verified from server and still no journey — send to wizard
            void navigate({ to: '/app/journey/create', replace: true });
            return;
        }

        let cancelled = false;

        void (async () => {
            await refreshJourney();
            if (!cancelled) setVerificationDone(true);
        })();

        return () => {
            cancelled = true;
        };
    }, [isLoading, journey, isOnWizard, navigate, refreshJourney, verificationDone]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (!isOnWizard && (isLoading || (journey === null && !verificationDone))) {
        return <AuthLoadingScreen />;
    }

    // ── Redirect pending ──────────────────────────────────────────────────────
    if (!isOnWizard && journey === null && verificationDone) {
        return null;
    }

    // ── Journey exists OR we're on the wizard ─────────────────────────────────
    return <>{children}</>;
}
