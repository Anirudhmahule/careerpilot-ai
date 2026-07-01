export type SnapshotStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AnalyzeResumeCommand {
  analysisSnapshotId: string;
  storagePath: string;
}

export interface ResumeExtractionResult {
  text: string;
  pageCount: number;
  info: unknown;
  metadata: unknown;
}

export interface ResumeAnalysisResult {
  success: boolean;
  extracted: {
    textPreview: string;
    pageCount: number;
    fileSize: number;
  };
}
