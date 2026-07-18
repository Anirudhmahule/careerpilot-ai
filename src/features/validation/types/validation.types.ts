import { z } from 'zod';

export type ValidationQuestionSemanticType = 
  | 'CONFIRM_CONTEXTUAL_SKILL'
  | 'DISCOVER_MISSING_SKILL'
  | 'CLARIFY_DEPTH';

export type ValidationQuestionInputType = 
  | 'BOOLEAN'
  | 'SINGLE_CHOICE'
  | 'TEXT';

export type ValidationGenerationStatus = 'pending' | 'completed' | 'failed';

// Internal Server-Side Candidate Contract
export type ValidationCandidate =
  | {
      candidateId: string;
      semanticType: 'CONFIRM_CONTEXTUAL_SKILL';
      inputType: 'BOOLEAN';
      skillId: string;
      skillCanonicalName: string;
      sourceEntityId: string;
      evidenceText: string;
    }
  | {
      candidateId: string;
      semanticType: 'DISCOVER_MISSING_SKILL';
      inputType: 'BOOLEAN';
      skillId: string;
      skillCanonicalName: string;
    }
  | {
      candidateId: string;
      semanticType: 'CLARIFY_DEPTH';
      inputType: 'SINGLE_CHOICE';
      sourceEntityId: string;
      sourceEntityType: 'experience' | 'project';
      sourceLabel: string;
    };

// AI wording generation boundary
export const GeneratedQuestionWordingSchema = z.object({
  candidateId: z.string().uuid(),
  questionText: z.string().min(5).max(500),
}).strict();

export const ValidationGenerationOutputSchema = z.object({
  questions: z.array(GeneratedQuestionWordingSchema).max(10), // Bounded question count
}).strict();

export type ValidationGenerationOutput = z.infer<typeof ValidationGenerationOutputSchema>;

// Request contracts
export const GenerateValidationQuestionsRequestSchema = z.object({
  analysisSnapshotId: z.string().uuid(),
  roleId: z.string().uuid(),
}).strict();

export const MutateValidationAnswerRequestSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("BOOLEAN"),
      value: z.boolean(),
    }).strict(),
    z.object({
      type: z.literal("SINGLE_CHOICE"),
      optionId: z.string().uuid(),
    }).strict(),
    z.object({
      type: z.literal("TEXT"),
      value: z.string().trim().min(1, "Text answer cannot be empty").max(1000),
    }).strict(),
  ]),
}).strict();
