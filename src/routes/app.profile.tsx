import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/features/auth";
import { useJourney } from "@/features/journey/hooks/useJourney";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — CareerPilot AI" }] }),
  component: Profile,
});

function Profile() {
  const { user, signOut } = useAuth();
  const { journey } = useJourney();
  const navigate = useNavigate();

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'ME';
  const displayName = user?.email ? user.email.split('@')[0] : 'Account';

  async function handleSignOut() {
    await signOut();
    await navigate({ to: '/auth/login', replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Profile" title="Account & preferences" description="Manage your identity, journeys and workspace settings." />

      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 rounded-xl border border-border bg-card p-6 shadow-xs lg:col-span-4 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="mt-3 text-base font-semibold">{displayName}</div>
            <div className="text-xs text-muted-foreground">{user?.email || "No email"}</div>
          </div>
        </section>

        <div className="col-span-12 space-y-4 lg:col-span-8">
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium">Account</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Email" value={user?.email || ""} readOnly />
            </div>
          </section>

          {journey ? (
            <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="text-xs font-medium">Active journey</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Target role" value={journey.target_role || "Unknown"} readOnly />
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="text-xs font-medium">Active journey</div>
              <div className="mt-3 text-sm text-muted-foreground">No active journey found.</div>
            </section>
          )}

          <section className="flex items-center justify-between rounded-xl border border-destructive/30 bg-card p-5 shadow-xs">
            <div>
              <div className="text-sm font-medium text-destructive">Sign out of this workspace</div>
              <div className="text-xs text-muted-foreground">You can sign back in anytime.</div>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-destructive/40 px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        defaultValue={value}
        readOnly={readOnly}
        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}