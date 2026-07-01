import { Logger } from "../../_shared/utils/logger.ts";
import { SnapshotRepositoryInterface } from "../../_shared/interfaces/snapshot.repository.interface.ts";
import { StorageProvider } from "../../_shared/interfaces/storage.provider.interface.ts";
import { PDFExtractor } from "../../_shared/interfaces/pdf-extractor.provider.interface.ts";
import { AIProvider } from "../../_shared/interfaces/ai.provider.interface.ts";
import { AnalyzeResumeCommand, ResumeAnalysisResult } from "../../_shared/types/domain.types.ts";
import { Result, success, failure } from "../../_shared/utils/result.ts";

export class ResumeAnalysisOrchestrator {
  constructor(
    private logger: Logger,
    private snapshotRepository: SnapshotRepositoryInterface,
    private storageProvider: StorageProvider,
    private pdfExtractor: PDFExtractor,
    private aiProvider: AIProvider
  ) {}

  async execute(command: AnalyzeResumeCommand): Promise<Result<ResumeAnalysisResult, Error>> {
    const { analysisSnapshotId, storagePath } = command;
    const overallStartTime = performance.now();
    
    this.logger.info(`Starting orchestrator for snapshot: ${analysisSnapshotId}`);

    try {
      // 1. Guard check (Database)
      const dbStart = performance.now();
      const currentStatus = await this.snapshotRepository.getStatus(analysisSnapshotId);
      const dbMs1 = performance.now() - dbStart;
      
      if (currentStatus !== "pending") {
        return failure(new Error(`Conflict: Snapshot is already ${currentStatus || "unknown"}`));
      }

      const dbStart2 = performance.now();
      await this.snapshotRepository.markProcessing(analysisSnapshotId);
      const dbMs2 = performance.now() - dbStart2;

      // 2. Download PDF (Storage)
      const downloadStart = performance.now();
      this.logger.info(`Downloading file: ${storagePath}`);
      const arrayBuffer = await this.storageProvider.downloadFile("resume-files", storagePath);
      const downloadMs = performance.now() - downloadStart;

      // 3. Extract PDF
      const pdfStart = performance.now();
      const pdfResult = await this.pdfExtractor.extractText(arrayBuffer);
      const pdfParseMs = performance.now() - pdfStart;

      // 4. AI Processing
      const aiStart = performance.now();
      const aiRawResponse = await this.aiProvider.analyzeResume(pdfResult.text, "v1");
      const aiMs = performance.now() - aiStart;

      const finalResponse = {
        success: true,
        extracted: {
          textPreview: pdfResult.text.substring(0, 200),
          pageCount: pdfResult.pageCount,
          fileSize: arrayBuffer.byteLength,
        },
        aiResponse: JSON.parse(aiRawResponse)
      };

      // 5. Mark Completed
      const dbStart3 = performance.now();
      await this.snapshotRepository.markCompleted(analysisSnapshotId, finalResponse, overallStartTime);
      const dbMs3 = performance.now() - dbStart3;

      const totalMs = performance.now() - overallStartTime;

      this.logger.info(`Analysis completed for ${analysisSnapshotId}`, {
        metrics: {
          download_ms: Math.round(downloadMs),
          pdf_parse_ms: Math.round(pdfParseMs),
          ai_ms: Math.round(aiMs),
          database_ms: Math.round(dbMs1 + dbMs2 + dbMs3),
          total_ms: Math.round(totalMs)
        }
      });
      
      return success(finalResponse);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Orchestrator failed for snapshot ${analysisSnapshotId}: ${errorMessage}`);
      
      try {
        await this.snapshotRepository.markFailed(analysisSnapshotId, errorMessage, overallStartTime);
      } catch (repoError) {
        this.logger.error(`Failed to mark status as failed`, repoError);
      }

      return failure(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
