/**
 * ConflictError is thrown by the orchestrator when a snapshot is already
 * processing or completed. It maps to HTTP 409 in the Edge Function handler.
 *
 * Lives here (not in index.ts) to avoid a circular import:
 *   index.ts → ResumeAnalysisOrchestrator → index.ts
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
