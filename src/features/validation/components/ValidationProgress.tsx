// ─── Props ────────────────────────────────────────────────────────────────────

interface ValidationProgressProps {
    answeredCount: number;
    totalCount: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ValidationProgress({ answeredCount, totalCount }: ValidationProgressProps) {
    if (totalCount === 0) return null;

    const pct = Math.round((answeredCount / totalCount) * 100);
    const isComplete = answeredCount === totalCount;

    return (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Progress</span>
                <span
                    className={
                        'text-xs font-semibold tabular-nums ' +
                        (isComplete ? 'text-success' : 'text-muted-foreground')
                    }
                >
                    {answeredCount} / {totalCount} answered
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border">
                <div
                    className={
                        'h-full rounded-full transition-all duration-500 ' +
                        (isComplete ? 'bg-success' : 'bg-primary')
                    }
                    style={{ width: `${pct}%` }}
                />
            </div>
            {isComplete && (
                <p className="mt-2 text-xs font-medium text-success">
                    All questions answered — you're ready to continue.
                </p>
            )}
        </div>
    );
}
