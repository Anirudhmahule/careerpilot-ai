-- Validation Phase 2: Security, Immutability, and Retry Hardening

-- ==============================================================================
-- 1. Table modifications: attempt_number for explicit retry model
-- ==============================================================================
ALTER TABLE validation_generations
ADD COLUMN attempt_number integer not null default 1;

-- Drop the old unique constraint (requires knowing the constraint name, which was validation_generations_unique_exec)
ALTER TABLE validation_generations
DROP CONSTRAINT validation_generations_unique_exec;

-- Add the new unique constraint including attempt_number
ALTER TABLE validation_generations
ADD CONSTRAINT validation_generations_unique_exec 
UNIQUE (analysis_snapshot_id, role_id, prompt_version, schema_version, attempt_number);

-- ==============================================================================
-- 2. RLS Hardening: Partial-write visibility protection
-- ==============================================================================
-- We must drop the existing SELECT policies on validation_questions and validation_question_options 
-- and recreate them with an explicit check for vg.status = 'completed'.

DROP POLICY "Users can view own validation questions" ON validation_questions;
CREATE POLICY "Users can view own validation questions"
  ON validation_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM validation_generations vg
      JOIN analysis_snapshots ans ON vg.analysis_snapshot_id = ans.id
      JOIN resume_versions rv ON ans.resume_version_id = rv.id
      WHERE vg.id = validation_questions.generation_id
      AND vg.status = 'completed'
      AND rv.user_id = auth.uid()
    )
  );

DROP POLICY "Users can view own validation question options" ON validation_question_options;
CREATE POLICY "Users can view own validation question options"
  ON validation_question_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM validation_questions vq
      JOIN validation_generations vg ON vq.generation_id = vg.id
      JOIN analysis_snapshots ans ON vg.analysis_snapshot_id = ans.id
      JOIN resume_versions rv ON ans.resume_version_id = rv.id
      WHERE vq.id = validation_question_options.question_id
      AND vg.status = 'completed'
      AND rv.user_id = auth.uid()
    )
  );

-- For validation_answers, the existing policy is just USING (user_id = auth.uid()).
-- While safe from a cross-user perspective, to be fully defensive against partial/failed generation leakage:
DROP POLICY "Users can view own validation answers" ON validation_answers;
CREATE POLICY "Users can view own validation answers"
  ON validation_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM validation_questions vq
      JOIN validation_generations vg ON vq.generation_id = vg.id
      WHERE vq.id = validation_answers.question_id
      AND vg.status = 'completed'
    )
    AND user_id = auth.uid()
  );
