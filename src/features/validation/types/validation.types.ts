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

export type MutateValidationAnswerRequest = z.infer<typeof MutateValidationAnswerRequestSchema>;

// DB Row Contracts
export interface ValidationGenerationRow {
  id: string;
  analysis_snapshot_id: string;
  role_id: string;
  status: ValidationGenerationStatus;
  prompt_version: string;
  schema_version: string;
  model: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface ValidationQuestionOptionRow {
  id: string;
  question_id: string;
  option_key: string;
  option_label: string;
  order_index: number;
}

export interface ValidationAnswerRow {
  question_id: string;
  user_id: string;
  boolean_value: boolean | null;
  selected_option_id: string | null;
  text_value: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValidationQuestionRow {
  id: string;
  generation_id: string;
  semantic_type: ValidationQuestionSemanticType;
  input_type: ValidationQuestionInputType;
  skill_id: string | null;
  source_entity_id: string | null;
  question_text: string;
  order_index: number;
  created_at: string;
  validation_question_options: ValidationQuestionOptionRow[];
  validation_answers: ValidationAnswerRow[];
}

