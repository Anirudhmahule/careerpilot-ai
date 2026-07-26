import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  FileText,
  Gauge,
  Github,
  LineChart,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerPilot AI — Navigate your software engineering career" },
      {
        name: "description",
        content:
          "AI-powered career readiness for software engineers. Analyze your resume, validate experience, identify skill gaps and follow a personalized learning roadmap.",
      },
      { property: "og:title", content: "CareerPilot AI" },
      {
        property: "og:description",
        content: "The career operating system for software engineers.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <Hero />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <ResumeAnalysisPreview />
      <RoadmapPreview />
      <InsightsPreview />
      <ComparisonPreview />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">CareerPilot</span>
          <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            AI
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#roadmap" className="hover:text-foreground">Roadmap</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/auth" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
            Sign in
          </Link>
          <Link
            to="/app/dashboard"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background shadow-xs hover:opacity-90"
          >
            Open app <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            New · Resume v2 comparison engine
            <ChevronRight className="h-3 w-3" />
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Navigate your engineering<br className="hidden sm:inline" /> career with{" "}
            <span className="bg-gradient-to-r from-primary to-[oklch(0.66_0.14_235)] bg-clip-text text-transparent">
              precision
            </span>
            .
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Upload your resume, validate your experience, see exactly where you stand for your
            target role, and follow a personalized roadmap to close every gap.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app/dashboard"
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Get started — free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#preview"
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-surface px-4 text-sm text-foreground hover:bg-accent"
            >
              See demo
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Resume stays private</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Built for engineers</span>
          </div>
        </div>

        <div id="preview" className="relative mx-auto mt-16 max-w-6xl">
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <HeroAppPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroAppPreview() {
  return (
    <div className="grid grid-cols-12 text-xs">
      {/* Mini sidebar */}
      <div className="col-span-3 hidden border-r border-border bg-surface p-3 sm:block">
        <div className="flex items-center gap-1.5 px-1">
          <div className="grid h-5 w-5 place-items-center rounded bg-primary text-primary-foreground">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="text-[12px] font-semibold">CareerPilot</span>
        </div>
        <div className="mt-4 space-y-0.5">
          {[
            ["Dashboard", true],
            ["Journey", false],
            ["Resume", false],
            ["Insights", false],
            ["Roadmap", false],
            ["Planner", false],
          ].map(([label, active]) => (
            <div
              key={label as string}
              className={
                "rounded px-2 py-1 " +
                (active ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground")
              }
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      {/* Body */}
      <div className="col-span-12 p-5 sm:col-span-9">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-primary">Dashboard</div>
            <div className="text-base font-semibold">Welcome back, Arjun</div>
          </div>
          <div className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] text-muted-foreground">
            Resume v4 · 2 days ago
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Readiness" value="78" unit="/100" tone="primary" />
          <MiniStat label="Skills covered" value="42" unit="/56" tone="success" />
          <MiniStat label="Roadmap progress" value="63" unit="%" tone="info" />
        </div>
        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-12 rounded-lg border border-border p-3 sm:col-span-7">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-medium">Readiness trend</div>
              <span className="text-[10px] text-success">+12 pts · 30d</span>
            </div>
            <MiniLineChart />
          </div>
          <div className="col-span-12 rounded-lg border border-border p-3 sm:col-span-5">
            <div className="text-[11px] font-medium">Top gaps</div>
            <ul className="mt-2 space-y-1.5">
              {[
                ["System design", 38, "destructive"],
                ["TypeScript depth", 56, "warning"],
                ["Testing patterns", 72, "primary"],
              ].map(([label, pct, tone]) => (
                <li key={label as string} className="flex items-center gap-2 text-[10px]">
                  <span className="w-24 truncate text-muted-foreground">{label}</span>
                  <div className="h-1 flex-1 rounded-full bg-border">
                    <div
                      className={
                        "h-full rounded-full " +
                        (tone === "destructive"
                          ? "bg-destructive"
                          : tone === "warning"
                          ? "bg-warning"
                          : "bg-primary")
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right tabular-nums text-muted-foreground">{pct as number}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "primary" | "success" | "info";
}) {
  const bg =
    tone === "primary" ? "bg-primary" : tone === "success" ? "bg-success" : "bg-[oklch(0.66_0.14_235)]";
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-border">
        <div className={"h-full rounded-full " + bg} style={{ width: "70%" }} />
      </div>
    </div>
  );
}

function MiniLineChart() {
  const pts = [42, 48, 46, 54, 60, 58, 64, 66, 70, 68, 74, 78];
  const max = 100;
  const w = 100;
  const h = 40;
  const step = w / (pts.length - 1);
  const path = pts
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.52 0.21 277)" stopOpacity="0.25" />
          <stop offset="1" stopColor="oklch(0.52 0.21 277)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g1)" />
      <path d={path} fill="none" stroke="oklch(0.52 0.21 277)" strokeWidth="1.5" />
    </svg>
  );
}

function LogoStrip() {
  const names = ["Stripe", "Linear", "Vercel", "Notion", "GitHub", "Framer"];
  return (
    <section className="border-b border-border bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
          Trusted by engineers shipping at
        </p>
        <div className="mt-5 grid grid-cols-3 gap-x-8 gap-y-4 opacity-70 sm:grid-cols-6">
          {names.map((n) => (
            <div key={n} className="text-center text-sm font-semibold tracking-tight text-muted-foreground">
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: FileText,
      title: "Deep resume analysis",
      body: "Parse every line. Extract skills, projects, ownership signals and outcomes — then map them to a role taxonomy.",
    },
    {
      icon: Gauge,
      title: "Readiness score",
      body: "A single number that tells you exactly how close you are to the role you want, with a breakdown you can act on.",
    },
    {
      icon: Target,
      title: "Validated experience",
      body: "Short, structured questions confirm what's real on your resume — no more inflated self-ratings.",
    },
    {
      icon: MapIcon,
      title: "Personalized roadmap",
      body: "Sprints, modules and daily tasks generated for your gaps, your timeline and your hours per day.",
    },
    {
      icon: LineChart,
      title: "Insights you can ship",
      body: "Skill matrix, role-fit, trend lines and gap priorities — designed like a real engineering dashboard.",
    },
    {
      icon: CircuitBoard,
      title: "Version-aware",
      body: "Compare any two resume versions side-by-side. See added skills, closed gaps and readiness delta.",
    },
  ];
  return (
    <section id="features" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platform"
          title="A career operating system for engineers."
          subtitle="Not a chatbot. Not an interview prep tool. A workspace built around your resume, your gaps and the role you want next."
        />
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-background p-6">
              <div className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Create a journey", d: "Pick a target role, experience level, timeline and daily hours." },
    { n: "02", t: "Upload your resume", d: "Drag in your PDF or DOCX. We parse, structure and version it." },
    { n: "03", t: "Validate your experience", d: "Answer a handful of focused questions to confirm what's real." },
    { n: "04", t: "See your readiness", d: "Get a score, a breakdown and a prioritized list of gaps." },
    { n: "05", t: "Follow the roadmap", d: "Sprints, modules and daily tasks tailored to your timeline." },
    { n: "06", t: "Re-analyze and compare", d: "Update your resume. Compare versions. Watch the score climb." },
  ];
  return (
    <section id="how" className="border-b border-border bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="How it works" title="Six steps from resume to ready." />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="text-xs font-semibold tracking-widest text-primary">{s.n}</div>
              <h4 className="mt-3 text-[15px] font-semibold tracking-tight">{s.t}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResumeAnalysisPreview() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionEyebrow>Resume analysis</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            We read your resume like a senior engineer would.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Every project, every bullet, every skill — mapped to a structured taxonomy and validated
            with focused questions. No hallucinated keywords. Just the truth about where you stand.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Structured extraction of skills, projects and ownership",
              "Mapped to a role-specific competency taxonomy",
              "Confidence scored per skill, validated by you",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-medium">arjun-kumar-resume.pdf</div>
            <span className="rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
              Analyzed
            </span>
          </div>
          <div className="space-y-3">
            {[
              { skill: "React", level: 92, tag: "Strong" },
              { skill: "TypeScript", level: 74, tag: "Solid" },
              { skill: "Next.js", level: 68, tag: "Solid" },
              { skill: "System design", level: 38, tag: "Gap", danger: true },
              { skill: "Testing (Vitest/Playwright)", level: 51, tag: "Improve", warn: true },
              { skill: "GraphQL", level: 24, tag: "Missing", danger: true },
            ].map((s) => (
              <div key={s.skill} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.skill}</span>
                  <span
                    className={
                      "rounded-md px-1.5 py-0.5 text-[10px] font-medium " +
                      (s.danger
                        ? "bg-destructive/10 text-destructive"
                        : s.warn
                        ? "bg-warning/15 text-[oklch(0.45_0.13_75)]"
                        : "bg-primary-soft text-primary")
                    }
                  >
                    {s.tag}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-border">
                  <div
                    className={
                      "h-full rounded-full " +
                      (s.danger ? "bg-destructive" : s.warn ? "bg-warning" : "bg-primary")
                    }
                    style={{ width: `${s.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapPreview() {
  const sprints = [
    { name: "Sprint 1 · Foundations", mods: ["TypeScript deep dive", "Modern React patterns"], pct: 100, done: true },
    { name: "Sprint 2 · Architecture", mods: ["Component design", "State management"], pct: 64 },
    { name: "Sprint 3 · System design", mods: ["Frontend at scale", "Caching & perf"], pct: 18 },
    { name: "Sprint 4 · Interview prep", mods: ["Behavioral · STAR", "Live coding patterns"], pct: 0 },
  ];
  return (
    <section id="roadmap" className="border-b border-border bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Roadmap"
          title="A learning plan that ships."
          subtitle="Sprints contain modules. Modules contain daily tasks. Built around your timeline and the gaps that matter."
        />
        <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-border bg-surface px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">Sprint</div>
            <div className="col-span-4 hidden md:block">Modules</div>
            <div className="col-span-3 text-right">Progress</div>
          </div>
          {sprints.map((s, i) => (
            <div key={s.name} className="grid grid-cols-12 items-center gap-4 border-b border-border px-5 py-4 last:border-b-0">
              <div className="col-span-12 md:col-span-5">
                <div className="flex items-center gap-2">
                  <div
                    className={
                      "grid h-6 w-6 place-items-center rounded-md text-[10px] font-semibold " +
                      (s.done
                        ? "bg-success/15 text-success"
                        : i === 1
                        ? "bg-primary-soft text-primary"
                        : "bg-surface text-muted-foreground border border-border")
                    }
                  >
                    {s.done ? "✓" : i + 1}
                  </div>
                  <div className="text-sm font-medium">{s.name}</div>
                </div>
              </div>
              <div className="col-span-12 hidden flex-wrap gap-1.5 md:col-span-4 md:flex">
                {s.mods.map((m) => (
                  <span key={m} className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                    {m}
                  </span>
                ))}
              </div>
              <div className="col-span-12 md:col-span-3">
                <div className="flex items-center justify-end gap-3">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                    <div
                      className={"h-full rounded-full " + (s.done ? "bg-success" : "bg-primary")}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{s.pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsightsPreview() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="order-2 rounded-xl border border-border bg-card p-6 shadow-sm lg:order-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Readiness</div>
              <div className="mt-1 text-4xl font-semibold tabular-nums">78<span className="text-base text-muted-foreground">/100</span></div>
              <div className="mt-1 text-xs text-success">+12 since last analysis</div>
            </div>
            <RadialScore value={78} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            {[
              ["Skills", 84, "success"],
              ["Experience", 72, "primary"],
              ["Projects", 81, "success"],
              ["System design", 38, "destructive"],
            ].map(([l, v, tone]) => (
              <div key={l as string} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="tabular-nums">{v}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-border">
                  <div
                    className={
                      "h-full rounded-full " +
                      (tone === "destructive" ? "bg-destructive" : tone === "success" ? "bg-success" : "bg-primary")
                    }
                    style={{ width: `${v}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <SectionEyebrow>Insights</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One score. Every reason it's where it is.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Readiness isn't a number you stare at. It's a breakdown — by skill, project, role-fit
            and experience — that tells you exactly what to do next.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Frontend Engineer", v: 86 },
              { label: "React Specialist", v: 81 },
              { label: "Next.js Engineer", v: 74 },
              { label: "Full-stack Engineer", v: 58 },
            ].map((r) => (
              <div key={r.label} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span>{r.label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{r.v}%</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${r.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RadialScore({ value }: { value: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
      <circle cx="40" cy="40" r={r} stroke="oklch(0.92 0.008 255)" strokeWidth="6" fill="none" />
      <circle
        cx="40"
        cy="40"
        r={r}
        stroke="oklch(0.52 0.21 277)"
        strokeWidth="6"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ComparisonPreview() {
  return (
    <section className="border-b border-border bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Compare"
          title="See exactly what your last update changed."
          subtitle="Resume v3 → v4. New skills, closed gaps, readiness delta. Like a diff for your career."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-2">
          {[
            { v: "v3", date: "Jan 12", score: 66 },
            { v: "v4", date: "Mar 04", score: 78, current: true },
          ].map((c) => (
            <div key={c.v} className="rounded-lg border border-border bg-background p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium">{c.v}</span>
                  <span className="text-xs text-muted-foreground">{c.date}</span>
                </div>
                {c.current && (
                  <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">Current</span>
                )}
              </div>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-3xl font-semibold tabular-nums">{c.score}</span>
                <span className="pb-1 text-xs text-muted-foreground">/100 readiness</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {c.v === "v4" ? (
                  <>
                    <DiffRow tone="add">+ TypeScript generics, Vitest</DiffRow>
                    <DiffRow tone="add">+ 2 production projects</DiffRow>
                    <DiffRow tone="rem">− Removed outdated jQuery</DiffRow>
                    <DiffRow tone="warn">~ Improved system design notes</DiffRow>
                  </>
                ) : (
                  <>
                    <DiffRow tone="muted">React, Next.js, Tailwind</DiffRow>
                    <DiffRow tone="muted">3 projects · 2 yrs experience</DiffRow>
                    <DiffRow tone="muted">Gap: TS depth, testing, sys design</DiffRow>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiffRow({ children, tone }: { children: React.ReactNode; tone: "add" | "rem" | "warn" | "muted" }) {
  const cls =
    tone === "add"
      ? "text-success"
      : tone === "rem"
      ? "text-destructive"
      : tone === "warn"
      ? "text-[oklch(0.55_0.15_75)]"
      : "text-muted-foreground";
  return <div className={"text-sm " + cls}>{children}</div>;
}

function Testimonials() {
  const items = [
    {
      q: "I stopped guessing what to learn next. The readiness score and roadmap gave my career a backlog.",
      a: "Priya S.",
      r: "Senior Frontend, fintech",
    },
    {
      q: "Felt like Linear, but for my career. The Insights page alone is worth it.",
      a: "Marcus T.",
      r: "Full-stack, SaaS",
    },
    {
      q: "Three resume iterations, +24 readiness points. Landed an L5 offer in 11 weeks.",
      a: "Aditi R.",
      r: "React engineer",
    },
  ];
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Loved by engineers" title="Quiet tool. Loud results." />
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.a} className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 text-[15px] leading-relaxed text-foreground">"{t.q}"</blockquote>
              <figcaption className="mt-5 text-sm">
                <div className="font-medium">{t.a}</div>
                <div className="text-muted-foreground">{t.r}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const qs = [
    { q: "Is my resume data private?", a: "Yes. Your resume is encrypted at rest and never used to train models. You can delete every version with one click." },
    { q: "Which roles are supported?", a: "Frontend, full-stack, React, Next.js, and platform engineering today. Backend, mobile and ML are rolling out next." },
    { q: "How accurate is the readiness score?", a: "The score blends parsed resume signals with validated answers. It's calibrated against real hiring rubrics — not vibes." },
    { q: "Do I need to know what I'm targeting?", a: "No. The journey wizard helps you pick a role, level and timeline that's realistic for your current resume." },
    { q: "Is there a free plan?", a: "Yes. 5 analyses, 2 resume versions and one active journey. No credit card needed." },
  ];
  return (
    <section id="faq" className="border-b border-border bg-surface/50">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered." />
        <div className="mt-10 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {qs.map((q) => (
            <details key={q.q} className="group p-5 [&_summary]:cursor-pointer">
              <summary className="flex items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
                <span>{q.q}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{q.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground text-background">
          <div className="absolute inset-0 dot-bg opacity-[0.08]" />
          <div className="relative grid grid-cols-1 items-center gap-6 p-8 sm:p-12 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-widest text-background/60">Ready when you are</div>
              <h3 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Stop guessing. Start shipping a career roadmap.
              </h3>
              <p className="mt-3 max-w-xl text-sm text-background/70">
                Upload your resume in under a minute. Get a readiness score, a gap analysis and a
                personalized roadmap. Free to start.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/app/dashboard"
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-background px-4 text-sm font-medium text-foreground hover:bg-background/90"
              >
                Get started <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href="#preview"
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-background/20 px-4 text-sm text-background hover:bg-background/10"
              >
                Watch demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 text-sm sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="col-span-2 lg:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">CareerPilot AI</span>
          </Link>
          <p className="mt-3 max-w-xs text-muted-foreground">
            The career operating system for software engineers.
          </p>
          <div className="mt-4 flex items-center gap-2 text-muted-foreground">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="grid h-8 w-8 place-items-center rounded-md border border-border hover:text-foreground">
              <Github className="h-4 w-4" />
            </a>
            <span aria-label="Fast" className="grid h-8 w-8 place-items-center rounded-md border border-border">
              <Zap className="h-4 w-4" />
            </span>
            <span aria-label="Secure" className="grid h-8 w-8 place-items-center rounded-md border border-border">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
        </div>
        {[
          { h: "Product", l: ["Features", "Roadmap", "Insights", "Compare", "Pricing"] },
          { h: "Company", l: ["About", "Blog", "Changelog", "Careers"] },
          { h: "Legal", l: ["Privacy", "Terms", "Security", "Contact"] },
        ].map((col) => (
          <div key={col.h}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.h}</div>
            <ul className="mt-3 space-y-2">
              {col.l.map((x) => (
                <li key={x}>
                  <span className="text-foreground/80">{x}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} CareerPilot AI. All rights reserved.</span>
          <span>Designed for engineers.</span>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-xl text-pretty text-base text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">{children}</span>
  );
}
