import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Github, Mail, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — CareerPilot AI" }] }),
  component: Auth,
});

function Auth() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative flex items-center justify-center bg-background px-6 py-12">
        <div className="absolute left-6 top-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">CareerPilot</span>
          </Link>
        </div>
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to continue your journey.
          </p>

          <div className="mt-8 space-y-2">
            <button className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium shadow-xs hover:bg-accent">
              <GoogleMark /> Continue with Google
            </button>
            <button className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium shadow-xs hover:bg-accent">
              <Github className="h-4 w-4" /> Continue with GitHub
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-3">
            <Field label="Email" type="email" placeholder="you@company.com" icon={<Mail className="h-4 w-4" />} />
            <Field label="Password" type="password" placeholder="••••••••" />
            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> Remember me
              </label>
              <a href="#" className="text-primary hover:underline">Forgot password?</a>
            </div>
            <Link
              to="/app/dashboard"
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            New here?{" "}
            <a href="#" className="text-foreground hover:underline">
              Create an account
            </a>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-surface lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative max-w-md text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live now
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">
            Your career, with the polish of a great codebase.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            CareerPilot turns your resume into a workspace — readiness, gaps, roadmap, planner.
            Built for software engineers.
          </p>
          <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left shadow-sm">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Readiness</span>
              <span className="text-success">+12 this month</span>
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-4xl font-semibold tabular-nums">78</span>
              <span className="pb-1.5 text-xs text-muted-foreground">/100</span>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-border">
              <div className="h-full w-[78%] rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  icon,
}: {
  label: string;
  type: string;
  placeholder: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <input
          type={type}
          placeholder={placeholder}
          className={
            "h-10 w-full rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 " +
            (icon ? "pl-8 pr-3" : "px-3")
          }
        />
      </div>
    </label>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.227c1.887-1.736 2.986-4.296 2.986-7.351Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.964-.895 6.614-2.422l-3.227-2.51c-.895.6-2.04.955-3.387.955-2.605 0-4.81-1.76-5.595-4.122H3.064v2.59A9.997 9.997 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.405 13.9A6.01 6.01 0 0 1 6.09 12c0-.66.114-1.302.314-1.9V7.51H3.064A9.997 9.997 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.341-2.59Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.978c1.47 0 2.787.505 3.823 1.496l2.866-2.866C16.96 2.99 14.696 2 12 2 8.087 2 4.71 4.243 3.064 7.51l3.341 2.59C7.19 7.738 9.395 5.978 12 5.978Z"
        fill="#EA4335"
      />
    </svg>
  );
}