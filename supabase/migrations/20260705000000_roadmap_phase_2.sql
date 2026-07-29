-- Roadmap Phase 2: Database Persistence + Versioning + Lifecycle

-- ==============================================================================
-- 1. Helper Function: Updated At
-- ==============================================================================
CREATE OR REPLACE FUNCTION roadmap_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 2. Table: roadmap_versions
-- ==============================================================================
CREATE TABLE roadmap_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid not null references journeys(id) on delete restrict,
  analysis_snapshot_id uuid not null references analysis_snapshots(id) on delete restrict,
  role_id uuid not null references roles(id) on delete restrict,
  role_slug text not null,
  generation_strategy text not null check (generation_strategy = 'hybrid-v1'),
  prompt_version text not null,
  model text not null,
  role_requirements_fingerprint text not null check (role_requirements_fingerprint <> ''),
  role_requirements_fingerprint_version text not null,
  plan_data jsonb not null,
  created_at timestamptz not null default now(),
  
  -- Composite unique keys to strictly enforce same-journey and same-owner integrity on child tables
  constraint roadmap_versions_journey_id_id_key unique (journey_id, id),
  constraint roadmap_versions_user_id_id_key unique (user_id, id)
);

-- Trigger to enforce immutability on roadmap_versions
CREATE OR REPLACE FUNCTION enforce_immutable_roadmap_versions_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'roadmap_versions is an immutable generated artifact and cannot be updated';
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_roadmap_versions_immutable
BEFORE UPDATE ON roadmap_versions
FOR EACH ROW EXECUTE FUNCTION enforce_immutable_roadmap_versions_update();

-- Trigger to validate cross-entity invariants on insert
CREATE OR REPLACE FUNCTION validate_roadmap_versions_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_journey_user_id uuid;
  v_role_slug text;
BEGIN
  -- 1. Validate Journey Ownership
  SELECT user_id INTO v_journey_user_id FROM journeys WHERE id = NEW.journey_id;
  IF v_journey_user_id != NEW.user_id THEN
    RAISE EXCEPTION 'roadmap_versions.user_id must match journeys.user_id';
  END IF;

  -- 2. Validate Role Slug matches Snapshot
  SELECT slug INTO v_role_slug FROM roles WHERE id = NEW.role_id;
  IF v_role_slug != NEW.role_slug THEN
    RAISE EXCEPTION 'roadmap_versions.role_slug must exactly match roles.slug at creation time';
  END IF;

  -- Note: snapshot ownership is deferred to server-side logic in Phase 3 
  -- because exact analysis_snapshots schema is unavailable here.

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_roadmap_versions_validate_insert
BEFORE INSERT ON roadmap_versions
FOR EACH ROW EXECUTE FUNCTION validate_roadmap_versions_insert();

-- ==============================================================================
-- 3. Table: roadmap_active_versions
-- ==============================================================================
CREATE TABLE roadmap_active_versions (
  journey_id uuid primary key references journeys(id) on delete cascade,
  roadmap_version_id uuid not null,
  updated_at timestamptz not null default now(),
  
  -- This composite foreign key ensures the active version actually belongs to this exact journey
  foreign key (journey_id, roadmap_version_id) references roadmap_versions(journey_id, id) on delete cascade
);

CREATE TRIGGER tr_roadmap_active_versions_updated_at
BEFORE UPDATE ON roadmap_active_versions
FOR EACH ROW EXECUTE FUNCTION roadmap_update_updated_at_column();

-- ==============================================================================
-- 4. Table: roadmap_task_progress
-- ==============================================================================
CREATE TABLE roadmap_task_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_version_id uuid not null,
  task_id uuid not null,
  status text not null check (status in ('PENDING', 'DONE', 'SKIPPED')),
  completed_at timestamptz,
  skipped_at timestamptz,
  user_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- A user cannot have multiple progress rows for the same version + task
  unique (roadmap_version_id, task_id),
  -- This composite foreign key ensures the progress row user exactly matches the roadmap_versions user
  foreign key (user_id, roadmap_version_id) references roadmap_versions(user_id, id) on delete cascade
);

-- Timestamp consistency rules
ALTER TABLE roadmap_task_progress ADD CONSTRAINT check_completed_at_consistency CHECK (
  (status = 'DONE' AND completed_at IS NOT NULL) OR
  (status != 'DONE' AND completed_at IS NULL)
);

ALTER TABLE roadmap_task_progress ADD CONSTRAINT check_skipped_at_consistency CHECK (
  (status = 'SKIPPED' AND skipped_at IS NOT NULL) OR
  (status != 'SKIPPED' AND skipped_at IS NULL)
);

CREATE TRIGGER tr_roadmap_task_progress_updated_at
BEFORE UPDATE ON roadmap_task_progress
FOR EACH ROW EXECUTE FUNCTION roadmap_update_updated_at_column();

-- ==============================================================================
-- 5. RLS Policies
-- ==============================================================================
ALTER TABLE roadmap_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_active_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_task_progress ENABLE ROW LEVEL SECURITY;

-- 5a. roadmap_versions
-- Users can read their own generated roadmaps
CREATE POLICY "Users can read own roadmap versions" ON roadmap_versions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Note: NO direct client DELETE policy. Immutable history cannot be casually destroyed by a client.
-- Account-level cascading deletion is supported via 'ON DELETE CASCADE' from auth.users.
-- Note: NO direct client INSERT/UPDATE policy. Bound to trusted service_role boundary.

-- 5b. roadmap_active_versions
-- Users can read their own journey's active pointer
CREATE POLICY "Users can read own active versions" ON roadmap_active_versions
FOR SELECT TO authenticated USING (
  journey_id IN (SELECT id FROM journeys WHERE user_id = auth.uid())
);
-- Note: NO INSERT/UPDATE policy. Pointer switches happen atomically on the trusted server boundary.

-- 5c. roadmap_task_progress
-- Users can read their own progress
CREATE POLICY "Users can read own progress" ON roadmap_task_progress
FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Note: NO INSERT/UPDATE policy. Progress writes MUST pass through a trusted server boundary 
-- to validate that the logical task_id UUID exists inside the JSONB plan_data.

-- ==============================================================================
-- 6. Indexes
-- ==============================================================================
-- Accelerates loading roadmap history for a journey
CREATE INDEX idx_roadmap_versions_user_journey ON roadmap_versions(user_id, journey_id);

-- Accelerates joining from an active pointer to the underlying version
CREATE INDEX idx_roadmap_active_versions_version_id ON roadmap_active_versions(roadmap_version_id);

-- Accelerates fetching all progress rows for the active roadmap version
CREATE INDEX idx_roadmap_task_progress_version_id ON roadmap_task_progress(roadmap_version_id);
