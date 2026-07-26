-- Taxonomy Phase 2: Canonical Normalized Name

-- Add the generated column safely without destroying existing constraints
ALTER TABLE skills
ADD COLUMN normalized_name text generated always as (lower(trim(canonical_name))) stored;

-- Enforce deterministic uniqueness at the database layer
ALTER TABLE skills
ADD CONSTRAINT skills_normalized_name_key UNIQUE (normalized_name);
