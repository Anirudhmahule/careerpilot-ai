import { Logger } from "../utils/logger.ts";
import { SnapshotRepositoryInterface } from "./interfaces/snapshot.repository.interface.ts";
import { StorageProvider } from "./interfaces/storage.provider.interface.ts";
import { PDFExtractor } from "./interfaces/pdf-extractor.provider.interface.ts";
import { AIProvider } from "./interfaces/ai.provider.interface.ts";
import { AnalyzeResumeCommand, AnalyzeResumeResponse } from "../types/resume-analysis.types.ts";
import { ResumeExtractionSchema, ResumeAnalysisSchema } from "../validators/resume-extraction.schema.ts";
import { ConflictError } from "../errors/conflict.error.ts";
import { Result, success, failure } from "../utils/result.ts";
import { ResumeExtractionSanitizer } from "./resume-extraction-sanitizer.ts";

export class ResumeAnalysisOrchestrator {
  constructor(
    private logger: Logger,
    private snapshotRepository: SnapshotRepositoryInterface,
    private storageProvider: StorageProvider,
    private pdfExtractor: PDFExtractor,
    private aiProvider: AIProvider
  ) {}

  async execute(command: AnalyzeResumeCommand): Promise<Result<AnalyzeResumeResponse, Error>> {
    const { analysisSnapshotId, storagePath } = command;
    const overallStartTime = performance.now();
    
    this.logger.info(`Starting orchestrator for snapshot: ${analysisSnapshotId}`);

    try {
      // 1. Guard check (Database)
      // TODO: Replace getStatus + markProcessing with a single atomic
      //       UPDATE ... WHERE status = 'pending' RETURNING id to eliminate
      //       the TOCTOU race condition. Fix after end-to-end analysis works.
      const dbStart = performance.now();
      const currentStatus = await this.snapshotRepository.getStatus(analysisSnapshotId);
      const dbMs1 = performance.now() - dbStart;
      
      if (currentStatus !== "pending") {
        return failure(new ConflictError(`Snapshot is already ${currentStatus || "unknown"}`));
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
      const aiRawResponse = await this.aiProvider.analyzeResume(pdfResult.text, "v2");
      const aiMs = performance.now() - aiStart;

      // 4a. Parse JSON — explicit error if the model returns malformed text
      let parsed: unknown;
      try {
        parsed = JSON.parse(aiRawResponse);
      } catch {
        throw new Error("AI returned non-JSON output. Cannot parse resume analysis.");
      }

      // 4b. Validate against the extraction schema (no IDs)
      //     ZodError is thrown here on schema mismatch and is caught below.
      const rawExtraction = ResumeExtractionSchema.parse(parsed);

      // 4c. Apply deterministic sanitation (pure boundary)
      const extraction = ResumeExtractionSanitizer.sanitize(rawExtraction);

      // 4d. Enrich: stamp UUIDs for all extracted entities.
      //     Explicit field-by-field construction keeps the enrichment boundary
      //     visible and prevents accidental field leakage from the extraction
      //     contract into the domain contract.
      const analysisCandidate = {
        metadata: extraction.metadata,
        personal: extraction.personal,
        summary: extraction.summary,
        education: extraction.education,
        languages: extraction.languages,
        links: extraction.links,
        missingInformation: extraction.missingInformation,
        warnings: extraction.warnings,
        skills: extraction.skills.map(s => ({
          id: crypto.randomUUID(),
          name: s.name,
          evidence: s.evidence,
        })),
        experience: extraction.experience.map(e => ({
          id: crypto.randomUUID(),
          company: e.company,
          title: e.title,
          employmentType: e.employmentType,
          location: e.location,
          startDate: e.startDate,
          endDate: e.endDate,
          isCurrent: e.isCurrent,
          description: e.description,
          responsibilities: e.responsibilities,
          technologies: e.technologies,
          evidence: e.evidence,
          achievements: e.achievements.map(a => ({
            id: crypto.randomUUID(),
            title: a.title,
            description: a.description,
            evidence: a.evidence,
          })),
        })),
        projects: extraction.projects.map(p => ({
          id: crypto.randomUUID(),
          name: p.name,
          role: p.role,
          description: p.description,
          technologies: p.technologies,
          features: p.features,
          github: p.github,
          liveDemo: p.liveDemo,
          evidence: p.evidence,
        })),
        certifications: extraction.certifications.map(c => ({
          id: crypto.randomUUID(),
          name: c.name,
          issuer: c.issuer,
          issueDate: c.issueDate,
          credentialUrl: c.credentialUrl,
        })),
        achievements: extraction.achievements.map(a => ({
          id: crypto.randomUUID(),
          title: a.title,
          description: a.description,
          evidence: a.evidence,
        })),
      };

      // 4e. Validate the enriched domain object.
      //     Completes the two-phase boundary: AI validation → enrichment → domain validation.
      const analysis = ResumeAnalysisSchema.parse(analysisCandidate);

      const finalResponse: AnalyzeResumeResponse = { analysis };

      // 5. Mark Completed
      const dbStart3 = performance.now();
      await this.snapshotRepository.markCompleted(
        analysisSnapshotId, 
        finalResponse, 
        Math.round(performance.now() - overallStartTime)
      );
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
        await this.snapshotRepository.markFailed(
          analysisSnapshotId, 
          errorMessage, 
          Math.round(performance.now() - overallStartTime)
        );
      } catch (repoError) {
        this.logger.error(`Failed to mark status as failed`, repoError);
      }

      return failure(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
