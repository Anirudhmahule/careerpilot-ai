import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { analysisService } from "@/features/analysis/services/analysis.service";
import type { AnalysisSnapshot } from "@/features/analysis/types/analysis.types";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/analysis")({
  validateSearch: (search: Record<string, unknown>) => ({
    snapshotId: typeof search.snapshotId === "string" ? search.snapshotId : undefined,
    // fileName is passed for display only; no DB fetch needed for it
    fileName: typeof search.fileName === "string" ? search.fileName : undefined,
  }),
  head: () => ({ meta: [{ title: "Analyzing — CareerPilot AI" }] }),
  component: Analysis,
});

// ─── Component ────────────────────────────────────────────────────────────────

function Analysis() {
  const { snapshotId, fileName } = Route.useSearch();

  const [snapshot, setSnapshot] = useState<AnalysisSnapshot | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  // Guard against overlapping in-flight requests
  const inFlightRef = useRef(false);
  // Cancellation flag — set true on unmount to drop stale setState calls
  const cancelledRef = useRef(false);
  // Terminal state guard — stop polling once complete/failed
  const isTerminalRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    isTerminalRef.current = false;

    if (!snapshotId) return;

    let intervalId: ReturnType<typeof setInterval>;

    async function fetchOnce() {
      if (inFlightRef.current || isTerminalRef.current) return;
      inFlightRef.current = true;

      const { data, error } = await analysisService.getSnapshotById(snapshotId!);
      inFlightRef.current = false;

      if (cancelledRef.current) return;

      if (error) {
        setPollError(error.message);
        return;
      }

      if (data) {
        setSnapshot(data);
        if (data.status === "completed" || data.status === "failed") {
          isTerminalRef.current = true;
          clearInterval(intervalId);
        }
      }
    }

    // Fetch immediately on mount — do not wait 3 s for the first result.
    void fetchOnce();

    intervalId = setInterval(() => {
      // Stop polling once the job has reached a terminal state
      if (isTerminalRef.current) {
        clearInterval(intervalId);
        return;
      }
      void fetchOnce();
    }, 3000);

    return () => {
      cancelledRef.current = true;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId]);

  // Stop the interval reactively when status reaches a terminal state
  const isTerminal = snapshot?.status === "completed" || snapshot?.status === "failed";
  const isCompleted = snapshot?.status === "completed";

  // ─── Dynamic Truthful Stages ─────────────────────────────────────────────
  const status = snapshot?.status || "pending";
  
  const stages = [
    {
      t: "Preparing resume",
      d: "Loading and extracting resume content",
      done: isCompleted || status === "processing",
      active: status === "pending",
    },
    {
      t: "Analyzing resume",
      d: "Extracting structured resume information",
      done: isCompleted,
      active: status === "processing",
    },
  ];

  const progressWidth =
    status === "completed" ? "w-full" :
    status === "processing" ? "w-[65%]" :
    status === "pending" ? "w-[15%]" :
    status === "failed" ? "w-[15%]" : "w-[0%]";

  // ─── Status badge ──────────────────────────────────────────────────────────

  function StatusBadge() {
    if (pollError) {
      return (
        <span className="rounded-md bg-destructive/15 px-2 py-1 text-[11px] font-medium text-destructive">
          Poll error
        </span>
      );
    }
    if (!snapshotId) {
      return (
        <span className="rounded-md bg-border px-2 py-1 text-[11px] text-muted-foreground">
          No snapshot
        </span>
      );
    }
    if (!snapshot) {
      return (
        <span className="rounded-md bg-border px-2 py-1 text-[11px] text-muted-foreground">
          Loading…
        </span>
      );
    }

    const statusStyles: Record<string, string> = {
      pending:    "bg-border text-muted-foreground",
      processing: "bg-primary/15 text-primary",
      completed:  "bg-success/15 text-success",
      failed:     "bg-destructive/15 text-destructive",
    };

    return (
      <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${statusStyles[snapshot.status] ?? "bg-border text-muted-foreground"}`}>
        {snapshot.status}
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Analyzing" title="Reading your resume." description="This usually takes 20–40 seconds." />

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Pipeline</div>
            <div className="text-sm font-medium">{fileName ?? "—"}</div>
          </div>
          <StatusBadge />
        </div>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full bg-primary transition-all ${progressWidth}`}
          />
        </div>

        {/* Real error message from the snapshot */}
        {snapshot?.status === "failed" && snapshot.error_message && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <span className="font-medium">Analysis failed:</span> {snapshot.error_message}
          </div>
        )}

        {/* Real poll error (network / DB error) */}
        {pollError && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <span className="font-medium">Status fetch error:</span> {pollError}
          </div>
        )}

        <ul className="mt-8 space-y-3">
          {stages.map((s) => (
            <li
              key={s.t}
              className={
                "flex items-center gap-3 rounded-lg border p-3 " +
                (s.active
                  ? "border-primary/40 bg-primary-soft/40"
                  : s.done
                  ? "border-border bg-background"
                  : "border-border bg-background opacity-60")
              }
            >
              <span
                className={
                  "grid h-7 w-7 place-items-center rounded-md " +
                  (s.done
                    ? "bg-success/15 text-success"
                    : s.active
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground border border-border")
                }
              >
                {s.done ? <Check className="h-3.5 w-3.5" /> : s.active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{s.t}</div>
                <div className="text-[11px] text-muted-foreground">{s.d}</div>
              </div>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {s.done ? "done" : s.active ? "in progress" : status === "failed" ? "stopped" : "queued"}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">You can leave this page — we'll notify you.</p>

          {/* Hidden until snapshot status is confirmed completed */}
          {isCompleted ? (
            <Link
              to="/app/insights"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-accent"
            >
              Continue to insights <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium opacity-40"
            >
              {isTerminal && !isCompleted ? "Analysis failed" : "Waiting for analysis…"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}