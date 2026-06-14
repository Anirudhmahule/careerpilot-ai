import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Circle, Clock, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — CareerPilot AI" }] }),
  component: Roadmap,
});

type Task = { t: string; m: string; done?: boolean };
type Mod = { name: string; pct: number; tasks: Task[] };
type Sprint = { name: string; range: string; modules: Mod[]; pct: number; status: "Done" | "Active" | "Upcoming" };

const data: Sprint[] = [
  {
    name: "Sprint 1 · Foundations",
    range: "Weeks 1–3",
    pct: 100,
    status: "Done",
    modules: [
      { name: "TypeScript deep dive", pct: 100, tasks: [{ t: "Generics & constraints", m: "1h", done: true }, { t: "Conditional types", m: "1h", done: true }] },
      { name: "Modern React patterns", pct: 100, tasks: [{ t: "Compound components", m: "45m", done: true }, { t: "Suspense & transitions", m: "1h", done: true }] },
    ],
  },
  {
    name: "Sprint 2 · Architecture",
    range: "Weeks 4–6",
    pct: 64,
    status: "Active",
    modules: [
      { name: "Component design", pct: 90, tasks: [{ t: "API design heuristics", m: "1h", done: true }, { t: "Props, slots, polymorphism", m: "45m", done: true }, { t: "Refactor: Form library", m: "2h" }] },
      { name: "State management", pct: 50, tasks: [{ t: "Local vs server state", m: "30m", done: true }, { t: "Zustand patterns", m: "1h" }, { t: "URL as state", m: "45m" }] },
      { name: "Data fetching", pct: 40, tasks: [{ t: "TanStack Query mental model", m: "1h", done: true }, { t: "Mutations & cache", m: "1h" }, { t: "Optimistic UI", m: "45m" }] },
    ],
  },
  {
    name: "Sprint 3 · System design",
    range: "Weeks 7–9",
    pct: 18,
    status: "Upcoming",
    modules: [
      { name: "Frontend at scale", pct: 25, tasks: [{ t: "Module federation", m: "1h" }, { t: "Monorepos & boundaries", m: "1h" }] },
      { name: "Caching & performance", pct: 10, tasks: [{ t: "HTTP caching", m: "45m" }, { t: "Lighthouse budgets", m: "45m" }] },
    ],
  },
  {
    name: "Sprint 4 · Interview prep",
    range: "Weeks 10–11",
    pct: 0,
    status: "Upcoming",
    modules: [
      { name: "Behavioral · STAR", pct: 0, tasks: [{ t: "Story bank", m: "1h" }] },
      { name: "Live coding patterns", pct: 0, tasks: [{ t: "Mock: design a debouncer", m: "45m" }] },
    ],
  },
];

function Roadmap() {
  const [open, setOpen] = useState<Record<string, boolean>>({ "Sprint 2 · Architecture": true });
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Roadmap"
        title="Your personalized learning plan."
        description="4 sprints · 11 weeks · calibrated for 2 hrs / day."
        actions={
          <>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs hover:bg-accent">
              Export plan
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <Sparkles className="h-3.5 w-3.5" /> Regenerate
            </button>
          </>
        }
      />

      {/* Overview header */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Sprints", "4"],
          ["Modules", "11"],
          ["Tasks", "47"],
          ["Est. hours", "82"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="text-xs font-medium">Timeline</div>
        <div className="mt-4 grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }).map((_, i) => {
            const sprintIdx = i < 3 ? 0 : i < 6 ? 1 : i < 9 ? 2 : 3;
            const s = data[sprintIdx];
            const tone =
              s.status === "Done" ? "bg-success" : s.status === "Active" ? "bg-primary" : "bg-border";
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={"h-2 w-full rounded-full " + tone} />
                <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <Legend dot="bg-success" label="Completed" />
          <Legend dot="bg-primary" label="Active" />
          <Legend dot="bg-border" label="Upcoming" />
        </div>
      </div>

      {/* Sprints */}
      <div className="space-y-3">
        {data.map((s) => {
          const isOpen = !!open[s.name];
          return (
            <section key={s.name} className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <button
                onClick={() => setOpen((o) => ({ ...o, [s.name]: !isOpen }))}
                className="grid w-full grid-cols-12 items-center gap-4 px-5 py-4 text-left hover:bg-accent/30"
              >
                <div className="col-span-12 flex items-center gap-3 md:col-span-5">
                  <span className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface text-muted-foreground">
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.range} · {s.modules.length} modules</div>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <StatusBadge s={s.status} />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <div className="flex items-center justify-end gap-3">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                      <div
                        className={"h-full rounded-full " + (s.status === "Done" ? "bg-success" : "bg-primary")}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{s.pct}%</span>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="grid gap-3 border-t border-border bg-surface/50 p-5 md:grid-cols-2">
                  {s.modules.map((m) => (
                    <div key={m.name} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{m.name}</div>
                        <span className="text-[10px] tabular-nums text-muted-foreground">{m.pct}%</span>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-border">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${m.pct}%` }} />
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {m.tasks.map((t) => (
                          <li key={t.t} className="flex items-center gap-2 text-sm">
                            {t.done ? (
                              <Check className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={"flex-1 " + (t.done ? "text-muted-foreground line-through" : "")}>{t.t}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" /> {t.m}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: Sprint["status"] }) {
  const cls =
    s === "Done"
      ? "bg-success/10 text-success"
      : s === "Active"
      ? "bg-primary-soft text-primary"
      : "bg-surface text-muted-foreground border border-border";
  return <span className={"inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium " + cls}>{s}</span>;
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={"h-2 w-2 rounded-full " + dot} />
      {label}
    </span>
  );
}