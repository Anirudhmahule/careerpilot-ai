import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowUp, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/insights")({
  head: () => ({ meta: [{ title: "Insights — CareerPilot AI" }] }),
  component: Insights,
});

const TABS = ["Overview", "Readiness", "Skills", "Gaps", "Role match"] as const;

function Insights() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Insights"
        title="Where you stand for Senior Frontend Eng."
        description="Score, breakdown, skills, gaps and role fit — all on one page."
        actions={
          <>
            <Link
              to="/app/compare"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs hover:bg-accent"
            >
              Compare v3 → v4
            </Link>
            <Link
              to="/app/roadmap"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="h-3.5 w-3.5" /> Regenerate roadmap
            </Link>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
              (tab === t ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview />}
      {tab === "Readiness" && <Readiness />}
      {tab === "Skills" && <SkillsTab />}
      {tab === "Gaps" && <Gaps />}
      {tab === "Role match" && <RoleMatch />}
    </div>
  );
}

function Overview() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">Readiness</div>
          <span className="text-[11px] text-success">+12 vs v3</span>
        </div>
        <div className="mt-4 flex items-center gap-6">
          <ScoreRing value={78} />
          <div className="space-y-1.5 text-sm">
            <Row k="Target" v="Senior Frontend Eng." />
            <Row k="Experience" v="Mid (3–5 yrs)" />
            <Row k="Timeline" v="3 months" />
            <Row k="Resume" v="v4 · Mar 04" />
          </div>
        </div>
        <p className="mt-5 rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground">
          You're tracking well. Closing 2 of 3 high-priority gaps would push readiness above 85 —
          competitive for the role you've targeted.
        </p>
      </section>

      <section className="col-span-12 grid grid-cols-2 gap-3 lg:col-span-7">
        {[
          { l: "Skills covered", v: "42/56", d: "+5" },
          { l: "High-priority gaps", v: "3", d: "-2" },
          { l: "Projects with impact", v: "5", d: "+1" },
          { l: "Role match (best)", v: "86%", d: "+9%" },
        ].map((c) => (
          <div key={c.l} className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs text-muted-foreground">{c.l}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{c.v}</div>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-success">
              <TrendingUp className="h-3 w-3" /> {c.d}
            </div>
          </div>
        ))}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="text-xs font-medium">Skill distribution</div>
          <SkillBars />
        </div>
      </section>
    </div>
  );
}

function Readiness() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 rounded-xl border border-border bg-card p-8 shadow-xs lg:col-span-5">
        <div className="flex flex-col items-center text-center">
          <ScoreRing value={78} large />
          <div className="mt-4 text-sm font-medium">Career readiness</div>
          <div className="text-xs text-muted-foreground">Senior Frontend Engineer</div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
            <TrendingUp className="h-3 w-3" /> +12 since v3
          </div>
        </div>
      </section>
      <section className="col-span-12 space-y-3 lg:col-span-7">
        {[
          { l: "Core skills", v: 84, d: "Strong in React, TS, modern tooling." },
          { l: "Experience signals", v: 72, d: "Mid-level ownership demonstrated." },
          { l: "Projects & impact", v: 81, d: "Outcomes quantified in 4 of 6 projects." },
          { l: "System design", v: 38, d: "Limited evidence of scale work." },
          { l: "Testing & quality", v: 56, d: "Some unit tests, no e2e patterns yet." },
          { l: "Communication signals", v: 74, d: "Clear bullets, structured sections." },
        ].map((b) => (
          <div key={b.l} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{b.l}</span>
              <span className="tabular-nums text-muted-foreground">{b.v}/100</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-border">
              <div
                className={
                  "h-full rounded-full " +
                  (b.v >= 75 ? "bg-success" : b.v >= 50 ? "bg-primary" : "bg-destructive")
                }
                style={{ width: `${b.v}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">{b.d}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

function SkillsTab() {
  const strong = ["React", "TypeScript (mid)", "Next.js", "Tailwind", "Vite", "Git", "Accessibility"];
  const weak = ["TypeScript generics", "Testing (Playwright)", "Performance", "RSC patterns"];
  const missing = ["System design", "GraphQL", "Web workers", "Real-time (WebSocket)"];
  return (
    <div className="grid grid-cols-12 gap-4">
      <SkillColumn title="Strong" tone="success" items={strong} />
      <SkillColumn title="To improve" tone="warning" items={weak} />
      <SkillColumn title="Missing" tone="destructive" items={missing} />

      <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="text-xs font-medium">Technology matrix</div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium">Skill</th>
                <th className="py-2 text-left font-medium">Category</th>
                <th className="py-2 text-left font-medium">Level</th>
                <th className="py-2 text-left font-medium">Validated</th>
                <th className="py-2 text-right font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["React", "Frontend", 92, true, "up"],
                ["TypeScript", "Language", 74, true, "up"],
                ["Next.js", "Framework", 68, true, "flat"],
                ["System design", "Architecture", 38, false, "up"],
                ["Vitest", "Testing", 51, true, "up"],
                ["GraphQL", "Data", 24, false, "down"],
              ].map(([s, c, lvl, val, trend]) => (
                <tr key={s as string} className="border-b border-border last:border-b-0">
                  <td className="py-2.5 font-medium">{s}</td>
                  <td className="py-2.5 text-muted-foreground">{c}</td>
                  <td className="py-2.5">
                    <div className="flex w-44 items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-border">
                        <div
                          className={
                            "h-full rounded-full " +
                            ((lvl as number) >= 70 ? "bg-success" : (lvl as number) >= 45 ? "bg-primary" : "bg-destructive")
                          }
                          style={{ width: `${lvl}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-[11px] tabular-nums text-muted-foreground">{lvl as number}</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={
                        "rounded-md px-1.5 py-0.5 text-[10px] font-medium " +
                        (val ? "bg-success/10 text-success" : "bg-warning/15 text-[oklch(0.45_0.13_75)]")
                      }
                    >
                      {val ? "Yes" : "Pending"}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {trend === "up" ? (
                      <ArrowUp className="ml-auto h-3.5 w-3.5 text-success" />
                    ) : trend === "down" ? (
                      <ArrowDown className="ml-auto h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <span className="text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Gaps() {
  const items = [
    { p: "High", s: "System design", w: "Caching, sharding, scale", est: "2 sprints" },
    { p: "High", s: "TypeScript generics", w: "Constraints, conditional types", est: "1 sprint" },
    { p: "High", s: "Testing (Playwright)", w: "E2E patterns, fixtures", est: "1 sprint" },
    { p: "Medium", s: "Caching strategies", w: "HTTP, CDN, SWR", est: "1 sprint" },
    { p: "Medium", s: "Performance budgets", w: "Lighthouse, RUM", est: "3 weeks" },
    { p: "Low", s: "Accessibility (WCAG)", w: "Forms, focus mgmt", est: "2 weeks" },
  ];
  const buckets = ["High", "Medium", "Low"] as const;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {buckets.map((b) => (
        <section key={b} className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">{b} priority</div>
            <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {items.filter((i) => i.p === b).length}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {items.filter((i) => i.p === b).map((g) => (
              <li key={g.s} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{g.s}</span>
                  <span className="text-[10px] text-muted-foreground">{g.est}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{g.w}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function RoleMatch() {
  const roles = [
    { r: "Frontend Engineer", m: 86, fit: ["React", "TS", "Next.js"], miss: ["Sys design"] },
    { r: "React Developer", m: 81, fit: ["React", "Patterns", "Tailwind"], miss: ["Testing", "Perf"] },
    { r: "Next.js Developer", m: 74, fit: ["Next.js", "RSC", "Edge"], miss: ["GraphQL"] },
    { r: "Full-stack Engineer", m: 58, fit: ["React"], miss: ["Node", "DB", "Sys design"] },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {roles.map((r) => (
        <section key={r.r} className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{r.r}</div>
              <div className="text-[11px] text-muted-foreground">Role-fit based on resume v4</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums">{r.m}%</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">match</div>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-border">
            <div className="h-full rounded-full bg-primary" style={{ width: `${r.m}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Strong match</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {r.fit.map((f) => (
                  <span key={f} className="rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">{f}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Missing</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {r.miss.map((m) => (
                  <span key={m} className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function ScoreRing({ value, large }: { value: number; large?: boolean }) {
  const size = large ? 180 : 110;
  const r = large ? 70 : 42;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(0.92 0.008 255)" strokeWidth={large ? 10 : 8} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="oklch(0.52 0.21 277)"
          strokeWidth={large ? 10 : 8}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={(large ? "text-5xl" : "text-3xl") + " font-semibold tabular-nums"}>{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="text-sm font-medium">{v}</span>
    </div>
  );
}

function SkillColumn({ title, tone, items }: { title: string; tone: "success" | "warning" | "destructive"; items: string[] }) {
  const dotCls = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-destructive";
  return (
    <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs md:col-span-6 lg:col-span-4">
      <div className="flex items-center gap-2">
        <span className={"h-2 w-2 rounded-full " + dotCls} />
        <div className="text-xs font-medium">{title}</div>
        <span className="ml-auto rounded-md bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">{items.length}</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li key={i} className="rounded-md border border-border bg-surface px-2 py-1 text-xs">{i}</li>
        ))}
      </ul>
    </section>
  );
}

function SkillBars() {
  const data = [
    { l: "Frontend", v: 88 },
    { l: "Language", v: 74 },
    { l: "Framework", v: 68 },
    { l: "Testing", v: 51 },
    { l: "Architecture", v: 38 },
    { l: "Data", v: 32 },
    { l: "DevOps", v: 28 },
    { l: "A11y", v: 64 },
  ];
  const max = 100;
  return (
    <div className="mt-4 grid grid-cols-8 items-end gap-2 sm:gap-3">
      {data.map((d) => (
        <div key={d.l} className="flex flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end">
            <div
              className="w-full rounded-md bg-gradient-to-t from-primary/70 to-primary"
              style={{ height: `${(d.v / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.l}</span>
        </div>
      ))}
    </div>
  );
}