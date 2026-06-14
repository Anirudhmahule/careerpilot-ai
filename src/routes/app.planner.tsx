import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/planner")({
  head: () => ({ meta: [{ title: "Planner — CareerPilot AI" }] }),
  component: Planner,
});

function Planner() {
  const [tab, setTab] = useState<"Calendar" | "Kanban">("Calendar");
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Planner"
        title="Your week, scheduled."
        description="Calendar for time-boxing, Kanban for flow. Same tasks, two views."
        actions={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> New task
          </button>
        }
      />
      <div className="mb-4 inline-flex rounded-lg border border-border bg-card p-1 text-sm">
        {(["Calendar", "Kanban"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "rounded-md px-3 py-1.5 text-xs font-medium " +
              (tab === t ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Calendar" ? <Calendar /> : <Kanban />}
    </div>
  );
}

function Calendar() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const eventsByDay: Record<number, { t: string; c: string }[]> = {
    3: [{ t: "TS generics", c: "bg-primary-soft text-primary" }],
    5: [{ t: "Sys design", c: "bg-warning/20 text-[oklch(0.45_0.13_75)]" }, { t: "PR review", c: "bg-success/15 text-success" }],
    9: [{ t: "RHF refactor", c: "bg-primary-soft text-primary" }],
    14: [{ t: "Today", c: "bg-foreground text-background" }],
    18: [{ t: "Mock interview", c: "bg-destructive/10 text-destructive" }],
    22: [{ t: "Caching", c: "bg-primary-soft text-primary" }],
    25: [{ t: "Module retro", c: "bg-success/15 text-success" }],
  };
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-sm font-semibold">March 2026</div>
        <div className="flex items-center gap-1">
          <button className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-accent"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <button className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">Today</button>
          <button className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-accent"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-border bg-surface text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {days.map((d) => <div key={d} className="px-3 py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => {
          const day = i - 5; // grid offset
          const valid = day >= 1 && day <= 31;
          const ev = eventsByDay[day] ?? [];
          const today = day === 14;
          return (
            <div key={i} className="min-h-[92px] border-b border-r border-border p-2 last:border-r-0 [&:nth-child(7n)]:border-r-0">
              <div className={
                "mb-1 flex h-5 w-5 items-center justify-center rounded-md text-[11px] " +
                (today ? "bg-primary text-primary-foreground font-semibold" : valid ? "text-muted-foreground" : "text-muted-foreground/40")
              }>
                {valid ? day : ""}
              </div>
              <div className="space-y-1">
                {ev.map((e) => (
                  <div key={e.t} className={"truncate rounded px-1.5 py-0.5 text-[10px] font-medium " + e.c}>{e.t}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Kanban() {
  const cols = [
    { name: "Pending", tone: "bg-muted-foreground", tasks: ["Read DDIA ch.5", "Plan Sprint 3 modules", "Outline behavioral stories"] },
    { name: "In Progress", tone: "bg-primary", tasks: ["RHF + Zod refactor", "TS generic constraints"], badge: "Today" },
    { name: "Blocked", tone: "bg-destructive", tasks: ["Mock interview — waiting on partner"] },
    { name: "Done", tone: "bg-success", tasks: ["TypeScript deep dive", "React patterns module", "Suspense study"] },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cols.map((c) => (
        <section key={c.name} className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="mb-3 flex items-center gap-2">
            <span className={"h-2 w-2 rounded-full " + c.tone} />
            <div className="text-xs font-semibold">{c.name}</div>
            <span className="ml-auto rounded-md bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">{c.tasks.length}</span>
          </div>
          <div className="space-y-2">
            {c.tasks.map((t) => (
              <div key={t} className="rounded-lg border border-border bg-background p-3 shadow-xs">
                <div className="text-sm font-medium">{t}</div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-md bg-surface px-1.5 py-0.5">Sprint 2</span>
                  <span>· 1h</span>
                </div>
              </div>
            ))}
            <button className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
              <Plus className="h-3 w-3" /> Add task
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}