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
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useJourney } from "@/features/journey/hooks/useJourney";
import { useResume } from "@/features/resume/hooks/useResume";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CareerPilot AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { journey } = useJourney();
  const { latestResume } = useResume();

  const displayName = user?.email
    ? user.email.split('@')[0]
    : 'User';
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Workspace"
        title={`Welcome back, ${capitalizedName}`}
        description="Here's where your career stands today, and what's next."
        actions={
          <>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-accent">
              <FileText className="h-3.5 w-3.5" /> New analysis
            </button>
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
        <StatCard label="Readiness" value="78" unit="/100" delta="+12" tone="primary" hint="vs last analysis" />
        <StatCard label="Skills covered" value="42" unit="/56" delta="+5" tone="success" hint="this sprint" />
        <StatCard label="Roadmap" value="63" unit="%" delta="+8%" tone="info" hint="3 of 4 sprints" />
        <StatCard label="Active gaps" value="11" unit="" delta="-4" tone="warning" hint="prioritized" negativeIsGood />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* Readiness trend */}
        <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs xl:col-span-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium">Readiness trend</div>
              <div className="text-xs text-muted-foreground">Last 12 weeks · {journey?.target_role || "Senior Frontend Eng."}</div>
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5 text-[11px]">
              {["1M", "3M", "6M", "All"].map((t, i) => (
                <button
                  key={t}
                  className={
                    "rounded px-2 py-0.5 " +
                    (i === 1 ? "bg-card text-foreground shadow-xs" : "text-muted-foreground")
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <TrendChart />
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
            <Legend dot="bg-primary" label="Readiness" value="78" />
            <Legend dot="bg-success" label="Skills" value="42/56" />
            <Legend dot="bg-[oklch(0.66_0.14_235)]" label="Role match" value="86%" />
          </div>
        </section>

        {/* Today */}
        <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs xl:col-span-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Today</div>
            <span className="text-[10px] text-muted-foreground">Thu · Mar 14</span>
          </div>
          <ul className="mt-3 space-y-2">
            {[
              { t: "Read: 'Designing data-intensive apps' ch.4", d: "30m · System design", done: true },
              { t: "Practice: TS generic constraints", d: "45m · TypeScript", done: false },
              { t: "Build: refactor Form to RHF + Zod", d: "1h · Patterns", done: false },
              { t: "Review: pull request from yesterday", d: "20m · Habits", done: false },
            ].map((t) => (
              <li
                key={t.t}
                className="group flex items-start gap-2 rounded-lg border border-border bg-background p-2.5 text-sm"
              >
                {t.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <div className={"truncate text-sm " + (t.done ? "text-muted-foreground line-through" : "")}>
                    {t.t}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{t.d}</div>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/app/planner"
            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open planner <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        {/* Roadmap progress */}
        <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium">Roadmap progress</div>
              <div className="text-xs text-muted-foreground">
                {journey ? `${journey.timeline_months} months · ${journey.daily_study_hours}h / day` : "4 sprints · 11 weeks"}
              </div>
            </div>
            <Link to="/app/roadmap" className="text-xs text-primary hover:underline">View roadmap</Link>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { n: "Sprint 1", t: "Foundations", pct: 100 },
              { n: "Sprint 2", t: "Architecture", pct: 64 },
              { n: "Sprint 3", t: "System design", pct: 18 },
              { n: "Sprint 4", t: "Interview prep", pct: 0 },
            ].map((s) => (
              <div key={s.n} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-3 text-xs text-muted-foreground">{s.n}</div>
                <div className="col-span-4 text-sm">{s.t}</div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className={"h-full rounded-full " + (s.pct === 100 ? "bg-success" : "bg-primary")}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">{s.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top gaps */}
        <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Top skill gaps</div>
            <Link to="/app/insights" className="text-xs text-primary hover:underline">All gaps</Link>
          </div>
          <ul className="mt-3 space-y-2.5">
            {[
              { s: "System design", lvl: 38, p: "High" },
              { s: "TypeScript generics", lvl: 56, p: "High" },
              { s: "Testing (Playwright)", lvl: 51, p: "Medium" },
              { s: "Caching strategies", lvl: 32, p: "Medium" },
              { s: "Accessibility (WCAG)", lvl: 64, p: "Low" },
            ].map((g) => (
              <li key={g.s} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{g.s}</span>
                  <PriorityChip p={g.p} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-border">
                    <div
                      className={
                        "h-full rounded-full " +
                        (g.p === "High" ? "bg-destructive" : g.p === "Medium" ? "bg-warning" : "bg-primary")
                      }
                      style={{ width: `${g.lvl}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-[11px] tabular-nums text-muted-foreground">{g.lvl}</span>
                </div>
              </li>
            ))}
          </ul>
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
  delta,
  tone,
  hint,
  negativeIsGood,
}: {
  label: string;
  value: string;
  unit: string;
  delta: string;
  tone: "primary" | "success" | "info" | "warning";
  hint: string;
  negativeIsGood?: boolean;
}) {
  const bar =
    tone === "primary" ? "bg-primary" : tone === "success" ? "bg-success" : tone === "info" ? "bg-[oklch(0.66_0.14_235)]" : "bg-warning";
  const pos = delta.startsWith("+");
  const good = negativeIsGood ? !pos : pos;
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={(good ? "text-success" : "text-destructive") + " text-[11px] font-medium"}>{delta}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
        <div className={"h-full rounded-full " + bar} style={{ width: "72%" }} />
      </div>
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
  return <span className={"rounded-md px-1.5 py-0.5 text-[10px] font-medium " + cls}>{p}</span>;
}

function Legend({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={"h-2 w-2 rounded-full " + dot} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto tabular-nums">{value}</span>
    </div>
  );
}

function TrendChart() {
  const readiness = [42, 46, 50, 54, 56, 60, 62, 65, 68, 70, 74, 78];
  const skills =   [28, 30, 32, 33, 35, 36, 37, 39, 40, 41, 41, 42];
  const role =     [55, 58, 60, 62, 66, 70, 73, 76, 79, 82, 84, 86];
  const w = 600, h = 180, pad = 20;
  const max = 100;
  const xs = (i: number) => pad + (i * (w - pad * 2)) / (readiness.length - 1);
  const ys = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const path = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(v)}`).join(" ");
  const area = (data: number[]) =>
    `${path(data)} L ${xs(data.length - 1)} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-44 w-full">
      <defs>
        <linearGradient id="dash-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.52 0.21 277)" stopOpacity="0.18" />
          <stop offset="1" stopColor="oklch(0.52 0.21 277)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={ys(g)} y2={ys(g)} stroke="oklch(0.92 0.008 255)" strokeDasharray="2 4" />
      ))}
      <path d={area(readiness)} fill="url(#dash-g)" />
      <path d={path(readiness)} fill="none" stroke="oklch(0.52 0.21 277)" strokeWidth="2" />
      <path d={path(role)} fill="none" stroke="oklch(0.66 0.14 235)" strokeWidth="1.5" strokeDasharray="4 4" />
      <path d={path(skills)} fill="none" stroke="oklch(0.66 0.16 160)" strokeWidth="1.5" />
    </svg>
  );
}