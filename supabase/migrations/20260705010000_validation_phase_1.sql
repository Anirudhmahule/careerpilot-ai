-- Validation Phase 1: Database Persistence and Security Foundations

-- ==============================================================================
-- 1. Helper Function: Immutability
-- ==============================================================================
CREATE OR REPLACE FUNCTION enforce_immutable_row()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Row is immutable and cannot be updated';
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 2. Table: validation_generations
-- ==============================================================================
CREATE TABLE validation_generations (
    id uuid primary key default gen_random_uuid(),
    analysis_snapshot_id uuid not null references analysis_snapshots(id) on delete restrict,
    role_id uuid not null references roles(id) on delete restrict,
    status text not null check (status in ('pending', 'completed', 'failed')),
    prompt_version text not null,
    schema_version text not null,
    model text not null,
    error_message text,
    created_at timestamptz not null default now(),
    completed_at timestamptz,
    
    constraint validation_generations_unique_exec unique (analysis_snapshot_id, role_id, prompt_version, schema_version)
);

CREATE OR REPLACE FUNCTION enforce_immutable_validation_generations()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('completed', 'failed') THEN
        RAISE EXCEPTION 'validation_generations is immutable once completed or failed';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_validation_generations_immutable
BEFORE UPDATE ON validation_generations
FOR EACH ROW EXECUTE FUNCTION enforce_immutable_validation_generations();

-- ==============================================================================
-- 3. Table: validation_questions
-- ==============================================================================
CREATE TABLE validation_questions (
    id uuid primary key default gen_random_uuid(),
    generation_id uuid not null references validation_generations(id) on delete cascade,
    semantic_type text not null check (semantic_type in ('CONFIRM_CONTEXTUAL_SKILL', 'DISCOVER_MISSING_SKILL', 'CLARIFY_DEPTH')),
    input_type text not null check (input_type in ('BOOLEAN', 'SINGLE_CHOICE', 'TEXT')),
    skill_id uuid references skills(id) on delete set null,
    source_entity_id text,
    question_text text not null check (question_text <> ''),
    order_index int not null,
    created_at timestamptz not null default now(),
    
    constraint validation_questions_order_unique unique (generation_id, order_index),
    -- Composite unique for answer FK
    constraint validation_questions_gen_id_unique unique (generation_id, id),
    -- Semantic checks
    constraint validation_questions_semantic_input_check check (
        (semantic_type IN ('CONFIRM_CONTEXTUAL_SKILL', 'DISCOVER_MISSING_SKILL') AND input_type = 'BOOLEAN') OR
        (semantic_type = 'CLARIFY_DEPTH')
    )
);

CREATE TRIGGER tr_validation_questions_immutable
BEFORE UPDATE ON validation_questions
FOR EACH ROW EXECUTE FUNCTION enforce_immutable_row();

-- ==============================================================================
-- 4. Table: validation_question_options
-- ==============================================================================
CREATE TABLE validation_question_options (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null references validation_questions(id) on delete cascade,
    option_key text not null check (option_key <> ''),
    option_label text not null check (option_label <> ''),
    order_index int not null,
    
    constraint validation_question_options_key_unique unique (question_id, option_key),
    constraint validation_question_options_order_unique unique (question_id, order_index),
    -- Composite unique for answer FK
    constraint validation_question_options_id_unique unique (question_id, id)
);

CREATE TRIGGER tr_validation_question_options_immutable
BEFORE UPDATE ON validation_question_options
FOR EACH ROW EXECUTE FUNCTION enforce_immutable_row();

-- ==============================================================================
-- 5. Table: validation_answers
-- ==============================================================================
CREATE TABLE validation_answers (
    question_id uuid not null references validation_questions(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    boolean_value boolean,
    selected_option_id uuid,
    text_value text check (length(text_value) <= 1000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    primary key (question_id, user_id),
    
    -- Option membership enforcement:
    constraint validation_answers_option_fk foreign key (question_id, selected_option_id)
        references validation_question_options(question_id, id) on delete restrict,
        
    -- Exactly one value must be populated
    constraint validation_answers_exactly_one_value check (
        (boolean_value IS NOT NULL AND selected_option_id IS NULL AND text_value IS NULL) OR
        (boolean_value IS NULL AND selected_option_id IS NOT NULL AND text_value IS NULL) OR
        (boolean_value IS NULL AND selected_option_id IS NULL AND text_value IS NOT NULL)
    )
);

-- Defense in depth: trigger to enforce input_type compatibility
CREATE OR REPLACE FUNCTION enforce_answer_type_compatibility()
RETURNS TRIGGER AS $$
DECLARE
  v_input_type text;
BEGIN
  SELECT input_type INTO v_input_type
  FROM validation_questions
  WHERE id = NEW.question_id;

  IF v_input_type = 'BOOLEAN' AND NEW.boolean_value IS NULL THEN
    RAISE EXCEPTION 'Question requires a BOOLEAN answer';
  END IF;
  
  IF v_input_type = 'SINGLE_CHOICE' AND NEW.selected_option_id IS NULL THEN
    RAISE EXCEPTION 'Question requires a SINGLE_CHOICE answer';
  END IF;
  
  IF v_input_type = 'TEXT' AND NEW.text_value IS NULL THEN
    RAISE EXCEPTION 'Question requires a TEXT answer';
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_enforce_answer_type_compatibility
BEFORE INSERT OR UPDATE ON validation_answers
FOR EACH ROW EXECUTE FUNCTION enforce_answer_type_compatibility();

CREATE TRIGGER tr_validation_answers_updated_at
BEFORE UPDATE ON validation_answers
FOR EACH ROW EXECUTE FUNCTION roadmap_update_updated_at_column();

-- ==============================================================================
-- 6. Indexes
-- ==============================================================================
CREATE INDEX idx_validation_generations_snapshot ON validation_generations(analysis_snapshot_id);
CREATE INDEX idx_validation_questions_generation ON validation_questions(generation_id);
CREATE INDEX idx_validation_questions_skill ON validation_questions(skill_id);
CREATE INDEX idx_validation_question_options_question ON validation_question_options(question_id);
CREATE INDEX idx_validation_answers_user ON validation_answers(user_id);

-- ==============================================================================
-- 7. Row Level Security
-- ==============================================================================
ALTER TABLE validation_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_answers ENABLE ROW LEVEL SECURITY;

-- SELECT Policies
CREATE POLICY "Users can view own validation generations"
  ON validation_generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analysis_snapshots ans
      JOIN resume_versions rv ON ans.resume_version_id = rv.id
      WHERE ans.id = validation_generations.analysis_snapshot_id
      AND rv.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own validation questions"
  ON validation_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM validation_generations vg
      JOIN analysis_snapshots ans ON vg.analysis_snapshot_id = ans.id
      JOIN resume_versions rv ON ans.resume_version_id = rv.id
      WHERE vg.id = validation_questions.generation_id
      AND rv.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own validation question options"
  ON validation_question_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM validation_questions vq
      JOIN validation_generations vg ON vq.generation_id = vg.id
      JOIN analysis_snapshots ans ON vg.analysis_snapshot_id = ans.id
      JOIN resume_versions rv ON ans.resume_version_id = rv.id
      WHERE vq.id = validation_question_options.question_id
      AND rv.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own validation answers"
  ON validation_answers FOR SELECT
  USING (user_id = auth.uid());

-- NOTE: All direct authenticated INSERT/UPDATE/DELETE policies for validation_answers 
-- are explicitly omitted. Mutation is deferred to a future trusted Phase 2 Edge Function 
-- to enforce type compatibility and ownership securely using service_role.
