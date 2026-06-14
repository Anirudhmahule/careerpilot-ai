import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Minus, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/compare")({
  head: () => ({ meta: [{ title: "Compare resumes — CareerPilot AI" }] }),
  component: Compare,
});

function Compare() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Compare"
        title="What changed between versions."
        description="A diff for your career. Added skills, closed gaps, readiness delta."
        actions={
          <Link
            to="/app/suggestions"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-3.5 w-3.5" /> Get suggestions <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { v: "v3", date: "Jan 12, 2026", score: 66 },
          { v: "v4", date: "Mar 04, 2026", score: 78, current: true },
        ].map((r) => (
          <div key={r.v} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-xs">
                {r.v} <ChevronDown className="h-3 w-3" />
              </button>
              <div>
                <div className="text-sm font-medium">arjun-kumar-frontend.pdf</div>
                <div className="text-[11px] text-muted-foreground">{r.date}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums">{r.score}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">readiness</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">Readiness delta</div>
          <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">+12 points</span>
        </div>
        <div className="mt-4 grid grid-cols-12 items-center gap-4 text-xs">
          <div className="col-span-3 text-right text-muted-foreground">v3 · 66</div>
          <div className="col-span-6 h-2 overflow-hidden rounded-full bg-border">
            <div className="relative h-full">
              <div className="absolute inset-y-0 left-0 w-[66%] bg-muted-foreground/40" />
              <div className="absolute inset-y-0 left-[66%] w-[12%] bg-success" />
              <div className="absolute inset-y-0 right-[22%] h-full w-px bg-foreground/30" />
            </div>
          </div>
          <div className="col-span-3 text-muted-foreground">v4 · 78</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DiffCard tone="add" title="Added skills" items={["TypeScript generics", "Vitest", "RHF + Zod", "Caching basics"]} />
        <DiffCard tone="rem" title="Removed" items={["Outdated jQuery", "Bootstrap v3 mention"]} />
        <DiffCard tone="up" title="Improved" items={["System design", "Testing patterns", "Project outcomes"]} />
        <DiffCard tone="closed" title="Closed gaps" items={["Modern React patterns", "TS depth (mid)"]} />
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="text-xs font-medium">Side-by-side diff</div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              v: "v3", lines: [
                { tone: "ctx", t: "Built React dashboard for analytics team." },
                { tone: "rem", t: "Used jQuery for some legacy widgets." },
                { tone: "ctx", t: "Wrote a few unit tests." },
                { tone: "ctx", t: "Worked with team on UI consistency." },
              ],
            },
            {
              v: "v4", lines: [
                { tone: "ctx", t: "Led React dashboard rebuild — 38% faster TTI." },
                { tone: "add", t: "Designed component API used by 4 teams." },
                { tone: "add", t: "Wrote 80+ Vitest unit tests + 12 Playwright e2e." },
                { tone: "up", t: "Owned design system migration (12 → 1 source)." },
              ],
            },
          ].map((s) => (
            <div key={s.v} className="rounded-lg border border-border bg-background p-4">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.v}</div>
              <ul className="space-y-1.5">
                {s.lines.map((l, i) => (
                  <li
                    key={i}
                    className={
                      "rounded-md px-2 py-1 text-xs " +
                      (l.tone === "add"
                        ? "bg-success/10 text-success"
                        : l.tone === "rem"
                        ? "bg-destructive/10 text-destructive line-through"
                        : l.tone === "up"
                        ? "bg-primary-soft text-primary"
                        : "text-muted-foreground")
                    }
                  >
                    {l.t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DiffCard({ tone, title, items }: { tone: "add" | "rem" | "up" | "closed"; title: string; items: string[] }) {
  const map = {
    add: { icon: <Plus className="h-3 w-3" />, cls: "bg-success/10 text-success", border: "border-success/30" },
    rem: { icon: <Minus className="h-3 w-3" />, cls: "bg-destructive/10 text-destructive", border: "border-destructive/30" },
    up: { icon: <Sparkles className="h-3 w-3" />, cls: "bg-warning/15 text-[oklch(0.45_0.13_75)]", border: "border-warning/30" },
    closed: { icon: <Plus className="h-3 w-3" />, cls: "bg-primary-soft text-primary", border: "border-primary/30" },
  }[tone];
  return (
    <section className={"rounded-xl border bg-card p-5 shadow-xs " + map.border}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">{title}</div>
        <span className={"rounded-md px-1.5 py-0.5 text-[10px] " + map.cls}>{items.length}</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className={"grid h-4 w-4 place-items-center rounded " + map.cls}>{map.icon}</span>
            <span className="truncate">{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}