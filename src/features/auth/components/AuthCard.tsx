/**
 * AuthCard
 *
 * Consistent card shell used by both Login and Signup pages.
 * Accepts a title, subtitle, and any form content as children.
 */

import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';

interface AuthCardProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
    return (
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
            {/* ── Form panel ─────────────────────────────────────────────────── */}
            <div className="relative flex items-center justify-center bg-background px-6 py-12">
                {/* Logo */}
                <div className="absolute left-6 top-6">
                    <Link to="/" className="flex items-center gap-2" aria-label="CareerPilot home">
                        <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-xs">
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <span className="text-[15px] font-semibold tracking-tight">CareerPilot</span>
                        <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            AI
                        </span>
                    </Link>
                </div>

                {/* Card body */}
                <div className="w-full max-w-sm">
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
                    <div className="mt-8">{children}</div>
                </div>
            </div>

            {/* ── Decorative panel ────────────────────────────────────────────── */}
            <div className="relative hidden overflow-hidden border-l border-border bg-surface lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
                <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
                <div className="relative max-w-md text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                        Live now
                    </span>
                    <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                        Your career, with the polish of a great codebase.
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground">
                        CareerPilot turns your resume into a workspace — readiness, gaps, roadmap, planner.
                        Built for software engineers.
                    </p>
                    <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left shadow-sm">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Readiness score</span>
                            <span className="text-success">+12 this month</span>
                        </div>
                        <div className="mt-1 flex items-end gap-2">
                            <span className="text-4xl font-semibold tabular-nums">78</span>
                            <span className="pb-1.5 text-xs text-muted-foreground">/100</span>
                        </div>
                        <div className="mt-4 h-1.5 rounded-full bg-border">
                            <div className="h-full w-[78%] rounded-full bg-primary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
