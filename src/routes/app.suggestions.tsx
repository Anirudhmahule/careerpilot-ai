import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/suggestions")({
  head: () => ({ meta: [{ title: "Resume suggestions — CareerPilot AI" }] }),
  component: Suggestions,
});

const groups = [
  {
    p: "High", tone: "destructive", items: [
      { t: "Quantify outcomes on top 3 projects", d: "Add metrics: % faster, $ saved, # users." },
      { t: "Demonstrate system design", d: "Mention scale, caching, trade-offs in dashboard role." },
      { t: "Show ownership scope", d: "'Led', 'Owned', 'Designed' instead of 'Worked on'." },
    ],
  },
  {
    p: "Medium", tone: "warning", items: [
      { t: "Group skills by category", d: "Frontend, Language, Testing, Tooling — easier to skim." },
      { t: "Add testing depth", d: "Specify Vitest, Playwright, coverage % if known." },
      { t: "Tighten summary to 2 lines", d: "Lead with role, scale, focus area." },
    ],
  },
  {
    p: "Low", tone: "primary", items: [
      { t: "Add GitHub & portfolio links", d: "One-click for recruiters." },
      { t: "Remove outdated tech (jQuery, Bootstrap 3)", d: "Signals modernity." },
      { t: "Use consistent date format", d: "MMM YYYY across all entries." },
    ],
  },
];

function Suggestions() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Suggestions"
        title="Make your resume read like a senior engineer's."
        description="Prioritized, actionable edits — generated from your analysis and target role."
        actions={
          <Link
            to="/app/resume"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Wand2 className="h-3.5 w-3.5" /> Apply & re-analyze <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.p} className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={
                    "rounded-md px-2 py-0.5 text-[11px] font-medium " +
                    (g.tone === "destructive"
                      ? "bg-destructive/10 text-destructive"
                      : g.tone === "warning"
                      ? "bg-warning/15 text-[oklch(0.45_0.13_75)]"
                      : "bg-primary-soft text-primary")
                  }
                >
                  {g.p} priority
                </span>
                <span className="text-xs text-muted-foreground">{g.items.length} actions</span>
              </div>
              <button className="text-xs text-primary hover:underline">Apply all</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {g.items.map((i) => (
                <div key={i.t} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                      <Sparkles className="h-3 w-3" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{i.t}</div>
                      <div className="mt-1 text-[12px] leading-snug text-muted-foreground">{i.d}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-1.5">
                    <button className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent">Skip</button>
                    <button className="rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background hover:opacity-90">Apply</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}