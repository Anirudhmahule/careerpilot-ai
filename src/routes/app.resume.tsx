import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CloudUpload, Download, FileText, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useResume } from "@/features/resume/hooks/useResume";
import { useJourney } from "@/features/journey/hooks/useJourney";
import { useAnalysis } from "@/features/analysis/hooks/useAnalysis";
import { analysisAiService } from "@/features/analysis/services/analysis-ai.service";

export const Route = createFileRoute("/app/resume")({
  head: () => ({ meta: [{ title: "Resume — CareerPilot AI" }] }),
  component: Resume,
});

/** Format an ISO timestamp into a human-readable date, e.g. "Jun 30, 2026". */
function formatDate(iso?: string): string {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function Resume() {
  const { isLoading, error, uploadResume, latestResume, resumes, deleteResume, getDownloadUrl } = useResume();
  const { journey } = useJourney();
  const navigate = useNavigate();
  const { createSnapshot, isLoading: isAnalysisLoading } = useAnalysis(latestResume?.id);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected after an error.
    e.target.value = "";
    if (!file || !journey) return;
    await uploadResume(file, journey.id);
  }

  async function handleDownload(storagePath: string) {
    const url = await getDownloadUrl(storagePath);
    if (url) {
      window.open(url, "_blank");
    }
  }

  async function handleAnalyze() {
    if (!latestResume) return;
    const { error: err, data: snapshot } = await createSnapshot({
      resume_version_id: latestResume.id,
      model: "gemini-3.5-flash",
      prompt_version: "v2"
    });
    
    if (!err && snapshot) {
      // Fire-and-forget: the Edge Function runs asynchronously and writes
      // results directly to the analysis_snapshots row. Errors are logged
      // here for observability but do not block navigation — the analysis
      // screen polls the row status independently.
      analysisAiService
        .invokeAnalysis(snapshot.id, latestResume.storage_path)
        .then(({ error: aiError }) => {
          if (aiError) {
            console.error("[handleAnalyze] Edge Function invocation failed:", aiError);
          }
        })
        .catch((e: unknown) => {
          console.error("[handleAnalyze] Edge Function invocation threw:", e);
        });

      void navigate({
        to: "/app/insights"
      });
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Resume"
        title="Your resume, versioned."
        description="Upload a new version to re-analyze. Compare any two to see what changed."
      />

      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 lg:col-span-7">
          <label className={`block${isLoading ? " pointer-events-none opacity-60" : ""}`}>
            <div className="group relative cursor-pointer rounded-xl border-2 border-dashed border-border bg-card p-10 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/30">
              <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
              <div className="relative">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-border bg-background text-primary shadow-xs">
                  <CloudUpload className="h-5 w-5" />
                </div>
                <div className="mt-4 text-sm font-medium">Drop your resume here, or click to upload</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF · up to 5 MB · we'll analyze automatically
                </p>
                <div className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  <FileText className="h-3.5 w-3.5" /> {isLoading ? "Uploading…" : "Choose file"}
                </div>
              </div>
              <input
                type="file"
                accept="application/pdf"
                disabled={isLoading}
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>
          </label>

          {/* Upload error — shown only when useResume reports a failure */}
          {error && (
            <p className="mt-2 text-xs text-destructive">{error.message}</p>
          )}

          <Link
            to="/app/insights"
            className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Skip upload, see insights <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        <aside className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs lg:col-span-5">
          <div className="text-xs font-medium">Current resume</div>
          {latestResume ? (
            <>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg border border-border bg-surface text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{latestResume.file_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    v{latestResume.version_number} · uploaded {formatDate(latestResume.uploaded_at)}
                  </div>
                </div>
                <span className="rounded-md bg-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Uploaded</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleDownload(latestResume.storage_path)}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background text-xs hover:bg-accent"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isLoading || isAnalysisLoading}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-foreground text-xs font-medium text-background hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Analyze Resume
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6 text-center text-xs text-muted-foreground">
              No resume uploaded yet. Upload a PDF to get started.
            </div>
          )}
        </aside>

        <section className="col-span-12 rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium">Version history</div>
              <div className="text-xs text-muted-foreground">All resumes stay private to your workspace.</div>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-12 gap-3 border-b border-border bg-surface px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-1">Ver.</div>
              <div className="col-span-7">File</div>
              <div className="col-span-2">Uploaded</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {isLoading && resumes.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground animate-pulse">
                Loading resumes...
              </div>
            ) : resumes.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No resume versions yet. Upload your first PDF above.
              </div>
            ) : (
              resumes.map((v) => (
                <div key={v.id} className="grid grid-cols-12 items-center gap-3 border-b border-border bg-background px-4 py-3 last:border-b-0 text-sm">
                  <div className="col-span-1">
                    {/* Highlight the latest version */}
                    <span className={
                      "rounded-md border px-1.5 py-0.5 text-[11px] font-medium " +
                      (v.id === latestResume?.id
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface text-muted-foreground")
                    }>v{v.version_number}</span>
                  </div>
                  <div className="col-span-7 min-w-0">
                    <div className="truncate font-medium">{v.file_name}</div>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">{formatDate(v.uploaded_at)}</div>
                  <div className="col-span-2 flex items-center justify-end gap-1 text-muted-foreground">
                    <button
                      type="button"
                      aria-label="Download resume"
                      onClick={() => void handleDownload(v.storage_path)}
                      className="grid h-7 w-7 place-items-center rounded-md hover:bg-accent hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete resume"
                      onClick={() => void deleteResume(v.id, v.storage_path)}
                      disabled={isLoading}
                      className="grid h-7 w-7 place-items-center rounded-md hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
