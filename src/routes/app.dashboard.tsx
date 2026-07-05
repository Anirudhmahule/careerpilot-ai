import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  FileText,
  Map as MapIcon,
  Plus,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import type { RoadmapTaskView } from "@/features/roadmap/types/roadmap-view.types";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard â€” CareerPilot AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: viewModel, isLoading, error } = useDashboard();

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Workspace"
          title="Welcome back"
          description="We couldn't load your dashboard context."
        />
        <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          <AlertTriangle className="mx-auto h-8 w-8 opacity-80" />
          <h3 className="mt-2 font-medium">Context Unavailable</h3>
          <p className="mt-1 text-sm opacity-80">
            Please ensure you have an active journey and supported role.
          </p>
          <Link
            to="/app/journey"
            className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create new journey
          </Link>
        </div>
      </div>
    );
  }

  // Still loading core context (Journey/Resume)
  if (isLoading.context) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse">
        <PageHeader
          eyebrow="Workspace"
          title="Welcome back"
          description="..."
        />
        <div className="mt-8 space-y-8">
          <div className="h-32 rounded-xl bg-muted" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 h-64 rounded-xl bg-muted xl:col-span-8" />
            <div className="col-span-12 h-64 rounded-xl bg-muted xl:col-span-4" />
          </div>
        </div>
      </div>
    );
  }

  // Pre-requisites not met
  if (!viewModel) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Workspace"
          title="Welcome back"
          description="Let's get started on your career journey."
        />
        <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center shadow-xs">
          <MapIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Start your journey</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Set your target role and upload a resume to see your personalized dashboard.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/app/journey"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Set up Journey
            </Link>
            <Link
              to="/app/resume"
              className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-accent"
            >
              Upload Resume
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { context, readiness, skills, gaps, roadmap } = viewModel;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Workspace"
        title="Welcome back"
        description="Here's where your career stands today, and what's next."
        actions={
          <>
            <Link
              to="/app/resume"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-accent"
            >
              <FileText className="h-3.5 w-3.5" /> Upload resume
            </Link>
            <Link
              to="/app/journey"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> New journey
            </Link>
          </>
        }
      />

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading.insights ? (
           <div className="col-span-2 flex items-center gap-3 rounded-xl border border-border bg-card p-5 animate-pulse"><div className="h-4 w-24 bg-muted rounded"></div></div>
        ) : (
          <>
            <StatCard
              label="Readiness"
              value={readiness ? readiness.score.toString() : "-"}
              unit={readiness ? "/100" : ""}
              tone="primary"
              hint={readiness ? "overall score" : "unavailable"}
              percentage={readiness ? readiness.score : 0}
            />
            <StatCard
              label="Skills covered"
              value={skills ? skills.matchedCount.toString() : "-"}
              unit={skills ? `/${skills.totalRequiredCount}` : ""}
              tone="success"
              hint={skills ? "matched skills" : "unavailable"}
              percentage={skills && skills.totalRequiredCount > 0 ? Math.round((skills.matchedCount / skills.totalRequiredCount) * 100) : 0}
            />
          </>
        )}

        {isLoading.roadmap ? (
           <div className="rounded-xl border border-border bg-card p-5 animate-pulse"><div className="h-4 w-24 bg-muted rounded"></div></div>
        ) : (
          <StatCard
            label="Roadmap"
            value={roadmap?.hasActiveRoadmap ? roadmap.completionPercentage.toString() : "-"}
            unit={roadmap?.hasActiveRoadmap ? "%" : ""}
            tone="info"
            hint={roadmap?.hasActiveRoadmap ? "completion" : "unavailable"}
            percentage={roadmap?.hasActiveRoadmap ? roadmap.completionPercentage : 0}
          />
        )}

        {isLoading.insights ? (
           <div className="rounded-xl border border-border bg-card p-5 animate-pulse"><div className="h-4 w-24 bg-muted rounded"></div></div>
        ) : (
          <StatCard
            label="Active gaps"
            value={gaps ? gaps.total.toString() : "-"}
            unit=""
            tone="warning"
            hint={gaps ? "missing skills" : "unavailable"}
            negativeIsGood
            percentage={100}
            hideBar={true}
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* Readiness overview */}
        <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs xl:col-span-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium">Readiness overview</div>
              <div className="text-xs text-muted-foreground">{context.targetRole || "Unknown Role"}</div>
            </div>
            {context.latestCompletedAnalysisAt && (
              <div className="text-[10px] text-muted-foreground border border-border rounded px-2 py-0.5">
                Analyzed: {new Date(context.latestCompletedAnalysisAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {isLoading.insights ? (
            <div className="mt-8 flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <span className="text-sm text-muted-foreground">Loading insights...</span>
            </div>
          ) : !readiness ? (
            <div className="mt-8 flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <span className="text-sm text-muted-foreground">Readiness analysis unavailable. Run an analysis first.</span>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <div className="text-sm font-medium">Requirement Coverage</div>
                <div className="mt-1 text-2xl font-semibold">{readiness.requirementCoverage.score}/100</div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {readiness.requirementCoverage.explanation}
                </div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="text-sm font-medium">Evidence Strength</div>
                <div className="mt-1 text-2xl font-semibold">{readiness.evidenceStrength.score}/100</div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {readiness.evidenceStrength.explanation}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Next Tasks */}
        <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs xl:col-span-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Next tasks</div>
          </div>

          <div className="mt-4 flex-1">
            {isLoading.roadmap ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-8">
                <span className="text-sm text-muted-foreground">Loading roadmap...</span>
              </div>
            ) : !roadmap?.hasActiveRoadmap ? (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <span className="text-sm text-muted-foreground">No active roadmap.</span>
                <Link to="/app/roadmap" className="mt-2 text-xs text-primary hover:underline">Generate one now</Link>
              </div>
            ) : roadmap.nextPendingTasks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <span className="text-sm text-muted-foreground">All caught up!</span>
                <CheckCircle2 className="mt-2 h-6 w-6 text-success opacity-50" />
              </div>
            ) : (
              <ul className="space-y-2">
                {roadmap.nextPendingTasks.map((t: RoadmapTaskView) => (
                  <li
                    key={t.id}
                    className="group flex items-start gap-2 rounded-lg border border-border bg-background p-2.5 text-sm"
                  >
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground capitalize">{t.type}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/app/roadmap"
            className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open planner <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        {/* Roadmap progress */}
        <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium">Roadmap progress</div>
            </div>
            <Link to="/app/roadmap" className="text-xs text-primary hover:underline">View roadmap</Link>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading.roadmap ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">Loading roadmap...</span>
              </div>
            ) : !roadmap?.hasActiveRoadmap ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">No active roadmap.</span>
              </div>
            ) : roadmap.phases.length === 0 ? (
               <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">Roadmap has no phases.</span>
              </div>
            ) : (
              roadmap.phases.map((s, idx) => {
                const total = s.tasks.length;
                const done = s.tasks.filter(t => t.status === 'DONE').length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div key={s.id} className="grid grid-cols-12 items-center gap-3">
                    <div className="col-span-3 text-xs text-muted-foreground truncate">Phase {idx + 1}</div>
                    <div className="col-span-4 text-sm truncate">{s.title}</div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className={`h-full rounded-full ${pct === 100 ? "bg-success" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <span className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">{done}/{total} ({pct}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Top gaps */}
        <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Top skill gaps</div>
            <Link to="/app/insights" className="text-xs text-primary hover:underline">All gaps</Link>
          </div>

          <div className="mt-3 space-y-2.5">
            {isLoading.insights ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">Loading gaps...</span>
              </div>
            ) : !gaps ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">Gaps analysis unavailable.</span>
              </div>
            ) : gaps.topGaps.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <span className="text-sm text-muted-foreground text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> No high priority gaps found!</span>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {gaps.topGaps.map((g) => (
                  <li key={g.skillId} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{g.canonicalName}</span>
                      <PriorityChip p={g.priority === 'high' ? 'High' : g.priority === 'medium' ? 'Medium' : 'Low'} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section className="col-span-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            to="/app/resume"
            icon={<FileText className="h-4 w-4" />}
            title="Upload new resume"
            sub="Version, analyze and compare."
          />
          <QuickAction
            to="/app/insights"
            icon={<TrendingUp className="h-4 w-4" />}
            title="Open insights"
            sub="Readiness, skills, gaps, role-fit."
          />
          <QuickAction
            to="/app/roadmap"
            icon={<MapIcon className="h-4 w-4" />}
            title="View roadmap"
            sub="Sprints, modules, daily tasks."
          />
          <QuickAction
            to="/app/compare"
            icon={<Sparkles className="h-4 w-4" />}
            title="Compare versions"
            sub="See exactly what changed."
          />
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  tone,
  hint,
  negativeIsGood,
  percentage,
  hideBar = false,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "primary" | "success" | "info" | "warning";
  hint: string;
  negativeIsGood?: boolean;
  percentage: number;
  hideBar?: boolean;
}) {
  const bar =
    tone === "primary" ? "bg-primary" : tone === "success" ? "bg-success" : tone === "info" ? "bg-[oklch(0.66_0.14_235)]" : "bg-warning";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      {!hideBar && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full ${bar}`}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
      <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  title,
  sub,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Link
      to={to as "/app/dashboard"}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs hover:border-border-strong hover:bg-accent"
    >
      <div className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

function PriorityChip({ p }: { p: string }) {
  const cls =
    p === "High"
      ? "bg-destructive/10 text-destructive"
      : p === "Medium"
      ? "bg-warning/15 text-[oklch(0.45_0.13_75)]"
      : "bg-primary-soft text-primary";
  return <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>{p}</span>;
}
