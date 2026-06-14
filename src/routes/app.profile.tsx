import { createFileRoute } from "@tanstack/react-router";
import { Bell, LogOut, Moon, Shield, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — CareerPilot AI" }] }),
  component: Profile,
});

function Profile() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Profile" title="Account & preferences" description="Manage your identity, journeys and workspace settings." />

      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-4">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">AK</div>
            <div className="mt-3 text-base font-semibold">Arjun Kumar</div>
            <div className="text-xs text-muted-foreground">arjun.k@gmail.com</div>
            <span className="mt-2 rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">Free plan</span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {[
              ["Journeys", "3"],
              ["Resumes", "4"],
              ["Readiness", "78"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-border bg-background py-2">
                <div className="text-base font-semibold tabular-nums">{v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
          <button className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background hover:opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> Upgrade to Pro
          </button>
        </section>

        <div className="col-span-12 space-y-4 lg:col-span-8">
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium">Account</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name" value="Arjun Kumar" />
              <Field label="Email" value="arjun.k@gmail.com" />
              <Field label="Location" value="Bengaluru, IN" />
              <Field label="GitHub" value="github.com/arjun-k" />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium">Active journey</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Target role" value="Senior Frontend Engineer" />
              <Field label="Experience" value="Mid (3–5 yrs)" />
              <Field label="Timeline" value="3 months" />
              <Field label="Daily focus" value="2 hrs / day" />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium">Preferences</div>
            <div className="mt-3 divide-y divide-border">
              <Toggle icon={<Moon className="h-4 w-4" />} title="Dark mode" sub="Use system or pick a theme." />
              <Toggle icon={<Bell className="h-4 w-4" />} title="Email notifications" sub="Weekly digest + nudges." on />
              <Toggle icon={<Shield className="h-4 w-4" />} title="Make resume private" sub="Never used to train models." on />
            </div>
          </section>

          <section className="flex items-center justify-between rounded-xl border border-destructive/30 bg-card p-5 shadow-xs">
            <div>
              <div className="text-sm font-medium text-destructive">Sign out of this workspace</div>
              <div className="text-xs text-muted-foreground">You can sign back in anytime.</div>
            </div>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-destructive/40 px-3 text-xs font-medium text-destructive hover:bg-destructive/10">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        defaultValue={value}
        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}

function Toggle({ icon, title, sub, on }: { icon: React.ReactNode; title: string; sub: string; on?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <span
        className={
          "relative inline-block h-5 w-9 rounded-full transition-colors " +
          (on ? "bg-primary" : "bg-border")
        }
      >
        <span
          className={
            "absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all " +
            (on ? "left-[18px]" : "left-0.5")
          }
        />
      </span>
    </div>
  );
}