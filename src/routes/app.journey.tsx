import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, CalendarRange, Check, Clock, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/journey")({
  head: () => ({ meta: [{ title: "Create journey — CareerPilot AI" }] }),
  component: Journey,
});

const STEPS = ["Target role", "Experience", "Timeline", "Daily focus", "Review"] as const;

function Journey() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("Senior Frontend Engineer");
  const [exp, setExp] = useState("Mid (3–5 yrs)");
  const [time, setTime] = useState("3 months");
  const [hours, setHours] = useState("2 hrs / day");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="New journey"
        title="Set the destination."
        description="A journey shapes the roadmap, the analysis and the planner. You can create more later."
      />

      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={
                "grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold " +
                (i < step
                  ? "bg-success/15 text-success"
                  : i === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground border border-border")
              }
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className={i === step ? "text-foreground font-medium" : ""}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs sm:p-8">
        {step === 0 && (
          <WizardStep
            icon={<Target className="h-4 w-4" />}
            heading="What role are you targeting?"
            sub="Pick the closest match — we'll fine-tune from your resume."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                "Senior Frontend Engineer",
                "React Specialist",
                "Next.js Engineer",
                "Full-stack Engineer",
                "Platform Engineer",
                "Mobile Engineer (RN)",
              ].map((r) => (
                <SelectableCard
                  key={r}
                  active={role === r}
                  onClick={() => setRole(r)}
                  title={r}
                  meta="42 skills · 6 modules"
                />
              ))}
            </div>
          </WizardStep>
        )}

        {step === 1 && (
          <WizardStep
            icon={<Briefcase className="h-4 w-4" />}
            heading="How much experience do you have?"
            sub="Used to calibrate readiness expectations."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["Junior (0–2)", "Mid (3–5 yrs)", "Senior (5–8)", "Staff (8+)"].map((e) => (
                <ChipCard key={e} active={exp === e} onClick={() => setExp(e)} label={e} />
              ))}
            </div>
          </WizardStep>
        )}

        {step === 2 && (
          <WizardStep
            icon={<CalendarRange className="h-4 w-4" />}
            heading="What's your target timeline?"
            sub="Drives sprint length and roadmap intensity."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["6 weeks", "3 months", "6 months", "Open"].map((t) => (
                <ChipCard key={t} active={time === t} onClick={() => setTime(t)} label={t} />
              ))}
            </div>
          </WizardStep>
        )}

        {step === 3 && (
          <WizardStep
            icon={<Clock className="h-4 w-4" />}
            heading="How much can you commit per day?"
            sub="We'll build a planner that respects this."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["30 min / day", "1 hr / day", "2 hrs / day", "4 hrs / day"].map((h) => (
                <ChipCard key={h} active={hours === h} onClick={() => setHours(h)} label={h} />
              ))}
            </div>
          </WizardStep>
        )}

        {step === 4 && (
          <WizardStep
            icon={<Sparkles className="h-4 w-4" />}
            heading="Review your journey"
            sub="Looks right? You can edit anything later."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Target role", role],
                ["Experience", exp],
                ["Timeline", time],
                ["Daily focus", hours],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-surface p-4">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                  <div className="mt-1 text-sm font-medium">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-border bg-primary-soft/40 p-4 text-sm text-foreground">
              <div className="font-medium">We'll generate</div>
              <ul className="mt-2 grid grid-cols-1 gap-1.5 text-muted-foreground sm:grid-cols-2">
                <li>· 4 sprints over {time}</li>
                <li>· ~32 modules tailored to your gaps</li>
                <li>· Daily plan based on {hours}</li>
                <li>· Readiness scoring vs {role}</li>
              </ul>
            </div>
          </WizardStep>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              to="/app/resume"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create journey <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function WizardStep({
  icon,
  heading,
  sub,
  children,
}: {
  icon: React.ReactNode;
  heading: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-primary">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-primary-soft">{icon}</span>
        <span className="font-semibold uppercase tracking-wider">Step</span>
      </div>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SelectableCard({
  active,
  onClick,
  title,
  meta,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  meta: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center justify-between rounded-lg border p-4 text-left transition-colors " +
        (active
          ? "border-primary bg-primary-soft/50"
          : "border-border bg-card hover:border-border-strong hover:bg-accent")
      }
    >
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{meta}</div>
      </div>
      <div
        className={
          "grid h-5 w-5 place-items-center rounded-full border " +
          (active ? "border-primary bg-primary text-primary-foreground" : "border-border")
        }
      >
        {active && <Check className="h-3 w-3" />}
      </div>
    </button>
  );
}

function ChipCard({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-lg border px-3 py-4 text-sm font-medium transition-colors " +
        (active
          ? "border-primary bg-primary-soft/50 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}