/**
 * AuthLoadingScreen
 *
 * Full-viewport spinner shown while the initial session is being resolved.
 * Prevents a flash of unauthenticated content on page load.
 */

import { Sparkles } from 'lucide-react';

export function AuthLoadingScreen() {
    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background"
            aria-busy="true"
            aria-label="Loading…"
        >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <Sparkles className="h-5 w-5 animate-pulse" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground">Loading CareerPilot…</p>
        </div>
    );
}
