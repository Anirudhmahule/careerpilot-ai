import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/analysis")({
  head: () => ({ meta: [{ title: "Analyzing — CareerPilot AI" }] }),
  component: Analysis,
});

const stages = [
  { t: "Extracting resume", d: "Parsing PDF, sections and entities", done: true },
  { t: "Analyzing skills", d: "Building skill graph from projects", done: true },
  { t: "Matching taxonomy", d: "Aligning to Senior Frontend rubric", done: true },
  { t: "Generating questions", d: "Personalized validation set", done: false, active: true },
  { t: "Preparing insights", d: "Readiness, gaps, role-fit", done: false },
];

function Analysis() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Analyzing" title="Reading your resume." description="This usually takes 20–40 seconds." />

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Pipeline</div>
            <div className="text-sm font-medium">arjun-kumar-frontend.pdf · v4</div>
          </div>
          <div className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] tabular-nums text-muted-foreground">
            00:18
          </div>
        </div>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full w-[64%] rounded-full bg-primary transition-all" />
        </div>

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
                {s.done ? "done" : s.active ? "in progress" : "queued"}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">You can leave this page — we'll notify you.</p>
          <Link
            to="/app/insights"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-accent"
          >
            Continue to insights <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}