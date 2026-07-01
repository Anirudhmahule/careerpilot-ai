import { SnapshotStatus } from "../types/domain.types.ts";

export interface SnapshotRepositoryInterface {
  getStatus(id: string): Promise<SnapshotStatus | null>;
  markProcessing(id: string): Promise<void>;
  markFailed(id: string, errorMessage: string, startTime: number): Promise<void>;
  markCompleted(id: string, rawResponse: unknown, startTime: number): Promise<void>;
}
