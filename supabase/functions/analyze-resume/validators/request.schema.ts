import { z } from "npm:zod";

export const AnalyzeResumeRequestSchema = z.object({
  analysisSnapshotId: z.string().uuid("Invalid analysisSnapshotId (must be a valid UUID)"),
  storagePath: z.string().min(1, "storagePath is required"),
});

export type AnalyzeResumeRequest = z.infer<typeof AnalyzeResumeRequestSchema>;
