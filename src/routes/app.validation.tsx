import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useResume } from "@/features/resume/hooks/useResume";
import { useJourney } from "@/features/journey/hooks/useJourney";
import { useAnalysis } from "@/features/analysis/hooks/useAnalysis";
import { useValidation } from "@/features/validation/hooks/useValidation";
import { ValidationList } from "@/features/validation/components/ValidationList";
import { ValidationProgress } from "@/features/validation/components/ValidationProgress";
import { mapTargetRoleToTaxonomySlug } from "@/features/taxonomy/utils/role-mapping";
import { taxonomyService } from "@/features/taxonomy/services/taxonomy.service";
import { supabase } from "@/lib/supabase";
import type { MutateValidationAnswerRequest } from "@/features/validation/types/validation.types";

export const Route = createFileRoute("/app/validation")({
  head: () => ({ meta: [{ title: "Validate Skills — CareerPilot AI" }] }),
  component: ValidationPage,
});

function ValidationPage() {
  const { journey, isLoading: isJourneyLoading } = useJourney();
  const { latestResume, isLoading: isResumeLoading } = useResume();
  const { latestCompletedSnapshot, isLoading: isAnalysisLoading } = useAnalysis(
    latestResume?.id
  );

  // Resolve the DB roleId from the journey's target_role string.
  const [roleId, setRoleId] = useState<string | null>(null);
  const [roleIdError, setRoleIdError] = useState<string | null>(null);
  const [isRoleIdLoading, setIsRoleIdLoading] = useState(false);

  useEffect(() => {
    if (!journey?.target_role) {
      setRoleId(null);
      return;
    }

    const roleMapping = mapTargetRoleToTaxonomySlug(journey.target_role);
    if (!roleMapping.supported) {
      setRoleIdError(
        `Role "${journey.target_role}" is not yet supported for skill validation.`
      );
      return;
    }

    let cancelled = false;
    setIsRoleIdLoading(true);
    setRoleIdError(null);

    taxonomyService
      .getRoleRequirements(roleMapping.slug, supabase)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setRoleIdError(error?.message ?? "Failed to resolve role requirements.");
        } else {
          setRoleId(data.roleId);
        }
        setIsRoleIdLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [journey?.target_role]);

  const {
    generation,
    questions,
    isLoading: isValidationLoading,
    isGenerating,
    error: validationError,
    isComplete,
    generateQuestions,
    submitAnswer,
  } = useValidation(
    latestCompletedSnapshot?.id,
    roleId ?? undefined
  );

  // ── Track answer submission in-flight ──────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAnswer = async (
    request: MutateValidationAnswerRequest
  ): Promise<void> => {
    setIsSubmitting(true);
    await submitAnswer(request);
    setIsSubmitting(false);
  };

  // ── Derived counts ─────────────────────────────────────────────────────────
  const answeredCount = questions.filter(
    (q) => q.validation_answers.length > 0
  ).length;

  // ── Aggregated loading ─────────────────────────────────────────────────────
  const isPageLoading =
    isJourneyLoading ||
    isResumeLoading ||
    isAnalysisLoading ||
    isRoleIdLoading;

  // ── Page header actions ────────────────────────────────────────────────────
  const headerActions = isComplete ? (
    <Link
      to="/app/roadmap"
      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Continue to Roadmap
      <ArrowRight className="h-4 w-4" />
    </Link>
  ) : null;

  // ── Render: top-level loading ──────────────────────────────────────────────
  if (isPageLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Validation"
          title="Validate Your Skills"
          description="Answer a few targeted questions to confirm your skill profile."
        />
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ── Render: no journey ─────────────────────────────────────────────────────
  if (!journey) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Validation"
          title="Validate Your Skills"
          description="Answer a few targeted questions to confirm your skill profile."
        />
        <EmptyCard
          icon={<AlertCircle className="h-10 w-10 text-muted-foreground" />}
          title="No journey found"
          body="Create a journey first to enable skill validation."
          action={
            <Link
              to="/app/journey/create"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Journey
            </Link>
          }
        />
      </div>
    );
  }

  // ── Render: role not supported ─────────────────────────────────────────────
  if (roleIdError) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Validation"
          title="Validate Your Skills"
          description="Answer a few targeted questions to confirm your skill profile."
        />
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{roleIdError}</p>
        </div>
      </div>
    );
  }

  // ── Render: no completed analysis ──────────────────────────────────────────
  if (!latestCompletedSnapshot) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Validation"
          title="Validate Your Skills"
          description="Answer a few targeted questions to confirm your skill profile."
        />
        <EmptyCard
          icon={<AlertCircle className="h-10 w-10 text-muted-foreground" />}
          title="No analysis found"
          body="Run an analysis on your resume first. Once it completes, you can validate your skills here."
          action={
            <Link
              to="/app/resume"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to Resume
            </Link>
          }
        />
      </div>
    );
  }

  // ── Render: main view ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Validation"
        title="Validate Your Skills"
        description="Answer a few targeted questions to help us fine-tune your readiness score."
        actions={headerActions}
      />

      {/* Validation error banner */}
      {validationError && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">{validationError.message}</p>
        </div>
      )}

      {/* Generate button — only shown when no generation exists yet */}
      {!generation && !isValidationLoading && (
        <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-xs">
          <Sparkles className="h-10 w-10 text-primary" />
          <div>
            <p className="text-sm font-medium">No validation questions yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Generate personalised questions based on your resume analysis and
              target role.
            </p>
          </div>
          <button
            id="generate-validation-questions"
            onClick={generateQuestions}
            disabled={isGenerating || !roleId}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? "Generating…" : "Generate Questions"}
          </button>
        </div>
      )}

      {/* Generation pending/failed notice */}
      {generation && generation.status === "pending" && !isGenerating && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generation in progress — please wait and refresh in a moment.
        </div>
      )}
      {generation && generation.status === "failed" && !isGenerating && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-medium">Generation failed</p>
            <p className="mt-1 text-xs">{generation.error_message ?? "An error occurred."}</p>
            <button
              id="retry-generate-validation-questions"
              onClick={generateQuestions}
              disabled={isGenerating}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-destructive px-3 text-xs font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
            >
              {isGenerating && <Loader2 className="h-3 w-3 animate-spin" />}
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Progress bar — only shown when questions exist */}
      {questions.length > 0 && (
        <ValidationProgress
          answeredCount={answeredCount}
          totalCount={questions.length}
        />
      )}

      {/* Question list */}
      {generation?.status === "completed" && (
        <ValidationList
          questions={questions}
          isLoading={isValidationLoading}
          error={validationError}
          isSubmitting={isSubmitting}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}

      {/* Continue to Roadmap — bottom CTA when complete */}
      {isComplete && (
        <div className="mt-8 flex justify-end">
          <Link
            to="/app/roadmap"
            id="continue-to-roadmap"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue to Roadmap
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Reusable empty-state card ─────────────────────────────────────────────────

function EmptyCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center shadow-xs">
      {icon}
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );
}
