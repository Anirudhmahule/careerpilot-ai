-- Taxonomy Phase 2: Seed v1 Frontend Skills
--
-- Seeds canonical skills and their common aliases for the three supported v1 roles:
--   - Frontend Engineer
--   - React Developer
--   - Next.js Developer
--
-- All inserts are idempotent (ON CONFLICT DO NOTHING).
-- Aliases only exist where genuinely useful for real-world extraction variants.

-- ==============================================================================
-- Skills
-- ==============================================================================

INSERT INTO skills (canonical_name, slug) VALUES
  ('React',               'react'),
  ('TypeScript',          'typescript'),
  ('JavaScript',          'javascript'),
  ('Next.js',             'nextjs'),
  ('HTML',                'html'),
  ('CSS',                 'css'),
  ('Tailwind CSS',        'tailwind-css'),
  ('Redux',               'redux'),
  ('Jest',                'jest'),
  ('Git',                 'git'),
  ('REST APIs',           'rest-apis'),
  ('React Query',         'react-query'),
  ('Vite',                'vite'),
  ('Supabase',            'supabase'),
  ('Node.js',             'nodejs')
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- Aliases
-- Handles real-world extraction variants from Gemini output.
-- Only added where the alias is meaningfully different from canonical_name.
-- ==============================================================================

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'ReactJS'       FROM skills WHERE slug = 'react'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'React.js'      FROM skills WHERE slug = 'react'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'React JS'      FROM skills WHERE slug = 'react'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'TS'            FROM skills WHERE slug = 'typescript'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'JS'            FROM skills WHERE slug = 'javascript'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'ES6'           FROM skills WHERE slug = 'javascript'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'NextJS'        FROM skills WHERE slug = 'nextjs'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'Next JS'       FROM skills WHERE slug = 'nextjs'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'Next.js 14'    FROM skills WHERE slug = 'nextjs'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'Next.js 15'    FROM skills WHERE slug = 'nextjs'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'Tailwind'      FROM skills WHERE slug = 'tailwind-css'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'TailwindCSS'   FROM skills WHERE slug = 'tailwind-css'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'Redux Toolkit' FROM skills WHERE slug = 'redux'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'RTK'           FROM skills WHERE slug = 'redux'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'TanStack Query'FROM skills WHERE slug = 'react-query'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'Node'          FROM skills WHERE slug = 'nodejs'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'NodeJS'        FROM skills WHERE slug = 'nodejs'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'REST API'      FROM skills WHERE slug = 'rest-apis'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'RESTful APIs'  FROM skills WHERE slug = 'rest-apis'
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO skill_aliases (skill_id, alias_name)
SELECT id, 'REST'          FROM skills WHERE slug = 'rest-apis'
ON CONFLICT (normalized_alias) DO NOTHING;
