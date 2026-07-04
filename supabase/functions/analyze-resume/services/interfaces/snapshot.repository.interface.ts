import { SnapshotStatus } from "../../types/resume-analysis.types.ts";

export interface SnapshotRepositoryInterface {
  getStatus(id: string): Promise<SnapshotStatus | null>;
  markProcessing(id: string): Promise<void>;
  markFailed(id: string, errorMessage: string, processingTimeMs: number): Promise<void>;
  markCompleted(id: string, rawResponse: unknown, processingTimeMs: number): Promise<void>;
}
