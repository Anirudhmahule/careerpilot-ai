-- Taxonomy Phase 1: Relational Foundation

-- ==============================================================================
-- 1. Table: skills
-- ==============================================================================
CREATE TABLE skills (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 2. Table: skill_aliases
-- ==============================================================================
CREATE TABLE skill_aliases (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references skills(id) on delete cascade,
  alias_name text not null,
  normalized_alias text generated always as (lower(trim(alias_name))) stored unique,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 3. Table: roles
-- ==============================================================================
CREATE TABLE roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 4. Table: role_skill_requirements
-- ==============================================================================
CREATE TABLE role_skill_requirements (
  role_id uuid not null references roles(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  importance text not null check (importance in ('required', 'important', 'optional')),
  created_at timestamptz not null default now(),
  primary key (role_id, skill_id)
);

-- ==============================================================================
-- 5. RLS Policies
-- ==============================================================================
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_skill_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users on skills" 
  ON skills FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users on skill_aliases" 
  ON skill_aliases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users on roles" 
  ON roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users on role_skill_requirements" 
  ON role_skill_requirements FOR SELECT TO authenticated USING (true);

-- ==============================================================================
-- 6. Seed Data (Idempotent)
-- ==============================================================================
INSERT INTO roles (name, slug) VALUES
  ('Frontend Engineer', 'frontend-engineer'),
  ('React Developer', 'react-developer'),
  ('Next.js Developer', 'nextjs-developer')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name;
