import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Circle, Clock, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useJourney } from "@/features/journey/hooks/useJourney";
import { supabase } from "@/lib/supabase";
import { isJourneyRole } from "@/features/journey/types/journey.types";
import type { JourneyRole } from "@/features/journey/types/journey.types";
import { useActiveRoadmap } from "@/features/roadmap/hooks/use-active-roadmap";
import { useResume } from "@/features/resume/hooks/useResume";
import { useAnalysis } from "@/features/analysis/hooks/useAnalysis";
import { taxonomyService } from "@/features/taxonomy/services/taxonomy.service";
import type { RoadmapPhaseView, RoadmapTaskView } from "@/features/roadmap/types/roadmap-view.types";

export const Route = createFileRoute("/app/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — CareerPilot AI" }] }),
  component: Roadmap,
});

function Roadmap() {
  const { journey, isLoading: isJourneyLoading, updateJourney } = useJourney();
  const [selectedUpdateRole, setSelectedUpdateRole] = useState<JourneyRole | "">("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const { latestResume, isLoading: isResumeLoading } = useResume();
  const { latestSnapshot, isLoading: isAnalysisLoading } = useAnalysis(latestResume?.id);
  const { roadmap, isLoading: isRoadmapLoading, error, mutateTaskStatus, mutationError, pendingTaskIds, isGenerating, generationError, generateRoadmap } = useActiveRoadmap(journey?.id);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const handleGenerate = async () => {
    if (!journey || !latestSnapshot) return;
    try {
      const slug = journey.target_role.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-');
      const roleReqs = await taxonomyService.getRoleRequirements(slug, supabase);
      if (roleReqs.error || !roleReqs.data) {
        alert("Failed to resolve role: " + (roleReqs.error?.message ?? "Unknown error"));
        return;
      }
      await generateRoadmap(latestSnapshot.id, roleReqs.data.roleId);
    } catch (err) {
      alert("An error occurred trying to prepare roadmap generation.");
    }
  };

  if (isJourneyLoading || isResumeLoading || isAnalysisLoading || isRoadmapLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader eyebrow="Roadmap" title="Your personalized learning plan." description="Loading your roadmap..." />
        <div className="mt-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader eyebrow="Roadmap" title="No Journey Found" description="Please create a journey to view your roadmap." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader eyebrow="Roadmap" title="Error Loading Roadmap" description="There was an error retrieving your roadmap." />
        <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (journey && !isJourneyRole(journey.target_role)) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader eyebrow="Roadmap" title="Action Required" description="Your target role needs to be updated." />
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center flex flex-col items-center justify-center shadow-xs">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unsupported Role</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Your current journey target role is <strong className="text-foreground">{journey.target_role}</strong>. This is a legacy role that is no longer supported for Roadmap generation. Please update your target role to continue.
          </p>
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={selectedUpdateRole}
              onChange={(e) => setSelectedUpdateRole(e.target.value as JourneyRole)}
              disabled={isUpdatingRole}
            >
              <option value="" disabled>Select a supported role...</option>
              <option value="Frontend Engineer">Frontend Engineer</option>
              <option value="React Developer">React Developer</option>
              <option value="Next.js Developer">Next.js Developer</option>
            </select>
            <button
              onClick={async () => {
                if (!selectedUpdateRole) return;
                setIsUpdatingRole(true);
                await updateJourney({ target_role: selectedUpdateRole });
                setIsUpdatingRole(false);
              }}
              disabled={!selectedUpdateRole || isUpdatingRole}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingRole ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Journey
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    const hasAnalysis = latestSnapshot && latestSnapshot.status === 'completed';

    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader eyebrow="Roadmap" title="No Roadmap Generated" description="You haven't generated a roadmap for this journey yet." />
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center flex flex-col items-center justify-center shadow-xs">
          {generationError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {generationError.message}
            </div>
          )}

          <p className="text-muted-foreground mb-6">
            {hasAnalysis
              ? "Your resume analysis is complete. Generate your personalized roadmap to get started."
              : "You need a completed resume analysis to generate a roadmap. Please upload and analyze your resume first."}
          </p>

          {hasAnalysis && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? "Generating..." : "Generate Roadmap"}
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Roadmap"
        title="Your personalized learning plan."
        description={`Target Role: ${roadmap.roleSlug} · Generated ${new Date(roadmap.generatedAt).toLocaleDateString()}`}
        actions={
          <>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs text-muted-foreground hover:bg-accent cursor-not-allowed" disabled title="Export is not yet supported">
              Export plan
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isGenerating ? "Regenerating..." : "Regenerate"}
            </button>
          </>
        }
      />

      {mutationError && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{mutationError.message}</p>
        </div>
      )}

      {generationError && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{generationError.message}</p>
        </div>
      )}

      {/* Overview header */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Phases", roadmap.phases.length.toString()],
          ["Tasks", roadmap.totalTasks.toString()],
          ["Completed", (roadmap.doneTasks + roadmap.skippedTasks).toString()],
          ["Progress", `${roadmap.completionPercentage}%`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      {/* Timeline Placeholder - omitted because phases don't map to strict weeks in the backend yet */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Overall Progress</div>
            <span className="text-xs font-semibold">{roadmap.completionPercentage}%</span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full bg-success transition-all duration-500" style={{ width: `${roadmap.completionPercentage}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <Legend dot="bg-success" label="Completed" />
          <Legend dot="bg-border" label="Pending" />
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {roadmap.phases.map((phase) => {
          const isOpen = open[phase.id] ?? true; // default open
          const phaseTotal = phase.tasks.length;
          const phaseCompleted = phase.tasks.filter(t => t.status !== 'PENDING').length;
          const phasePct = phaseTotal === 0 ? 0 : Math.round((phaseCompleted / phaseTotal) * 100);

          let statusText: 'Done' | 'Active' | 'Upcoming' = 'Upcoming';
          if (phasePct === 100) statusText = 'Done';
          else if (phasePct > 0) statusText = 'Active';

          return (
            <section key={phase.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <button
                onClick={() => setOpen((o) => ({ ...o, [phase.id]: !isOpen }))}
                className="grid w-full grid-cols-12 items-center gap-4 px-5 py-4 text-left hover:bg-accent/30"
              >
                <div className="col-span-12 flex items-center gap-3 md:col-span-5">
                  <span className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface text-muted-foreground">
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{phase.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{phase.objective}</div>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <StatusBadge s={statusText} />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <div className="flex items-center justify-end gap-3">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                      <div
                        className={"h-full rounded-full " + (statusText === "Done" ? "bg-success" : "bg-primary")}
                        style={{ width: `${phasePct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{phasePct}%</span>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border bg-surface/50 p-5">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <ul className="space-y-2">
                        {phase.tasks.map((t) => {
                          const isDone = t.status === 'DONE' || t.status === 'SKIPPED';
                          const isSkipped = t.status === 'SKIPPED';
                          const isPendingMutation = pendingTaskIds.has(t.id);

                          return (
                            <li key={t.id} className="flex">
                              <button
                                disabled={isPendingMutation || isSkipped}
                                onClick={() => {
                                  if (!isSkipped) {
                                    mutateTaskStatus(t.id, t.status === 'DONE' ? 'PENDING' : 'DONE');
                                  }
                                }}
                                aria-label={isDone ? `Mark task ${t.title} as incomplete` : `Mark task ${t.title} as complete`}
                                className="flex w-full items-start gap-3 text-sm p-2 rounded-md hover:bg-accent/30 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="mt-0.5 shrink-0">
                                  {isPendingMutation ? (
                                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                                  ) : isDone ? (
                                    <Check className="h-4 w-4 text-success" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={"font-medium " + (isDone ? "text-muted-foreground line-through" : "")}>{t.title}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                                </div>
                                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">
                                  {t.type}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: 'Done' | 'Active' | 'Upcoming' }) {
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
