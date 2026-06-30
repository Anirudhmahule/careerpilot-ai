import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Command,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  User,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { OnboardingGate } from "@/features/journey/components/OnboardingGate";
import { useJourney } from "@/features/journey/hooks/useJourney";
import { useResume } from "@/features/resume/hooks/useResume";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/journey", label: "Journey", icon: Target },
  { to: "/app/resume", label: "Resume", icon: FileText },
  { to: "/app/insights", label: "Insights", icon: Gauge },
  { to: "/app/roadmap", label: "Roadmap", icon: MapIcon },
  { to: "/app/planner", label: "Planner", icon: CalendarDays },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { journey } = useJourney();
  const { latestResume } = useResume();

  async function handleSignOut() {
    await signOut();
    await navigate({ to: '/auth/login', replace: true });
  }

  // Derive display initials from the user's email
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'ME';
  const displayName = user?.email
    ? user.email.split('@')[0]
    : 'Account';

  return (
    <div className="min-h-screen bg-surface text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-background lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">CareerPilot</span>
          <span className="ml-1 rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            AI
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <p className="px-2 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {nav.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={
                      "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors " +
                      (active
                        ? "bg-primary-soft text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground")
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="px-2 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent
          </p>
          <ul className="space-y-0.5 text-sm">
            {journey ? (
              <li key={journey.id}>
                <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-muted-foreground hover:bg-accent hover:text-foreground">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="truncate">{journey.target_role}</span>
                </button>
              </li>
            ) : (
              ["Senior Frontend Eng.", "React Specialist", "Full-stack Pivot"].map((j, i) => (
                <li key={j}>
                  <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-muted-foreground hover:bg-accent hover:text-foreground">
                    <span
                      className={
                        "h-1.5 w-1.5 shrink-0 rounded-full " +
                        (i === 0 ? "bg-primary" : i === 1 ? "bg-success" : "bg-warning")
                      }
                    />
                    <span className="truncate">{j}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-primary-soft text-primary">
                <Sparkles className="h-3 w-3" />
              </span>
              Free plan
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              2 of 5 AI analyses used this month.
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
              <div className="h-full w-2/5 rounded-full bg-primary" />
            </div>
            <button className="mt-3 w-full rounded-md bg-foreground px-2 py-1.5 text-xs font-medium text-background hover:opacity-90">
              Upgrade to Pro
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Settings className="h-3.5 w-3.5" /> Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface text-muted-foreground lg:hidden">
              <Command className="h-4 w-4" />
            </button>
            <div className="hidden min-w-0 items-center gap-1.5 text-sm text-muted-foreground md:flex">
              <span className="truncate">{journey?.target_role || "Senior Frontend Eng."}</span>
              <span>/</span>
              <span className="truncate text-foreground">
                {nav.find((n) => pathname.startsWith(n.to))?.label ?? "Workspace"}
              </span>
            </div>
            <div className="relative ml-auto hidden w-full max-w-xs md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search resumes, skills, tasks…"
                className="h-8 w-full rounded-md border border-border bg-surface pl-8 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="hidden items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground md:inline-flex">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {latestResume ? `Resume v${latestResume.version_number}` : "No resume"}
              <ChevronDown className="h-3 w-3" />
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <Sun className="h-4 w-4" />
            </button>
            <button className="relative grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>
            <div className="ml-1 flex h-8 items-center gap-2 rounded-md border border-border bg-surface pl-1 pr-2">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
                {initials}
              </div>
              <span className="hidden text-xs font-medium sm:inline">{displayName}</span>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <ProtectedRoute>
            <OnboardingGate>
              <Outlet />
            </OnboardingGate>
          </ProtectedRoute>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}