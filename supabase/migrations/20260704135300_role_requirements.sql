-- Role Requirements Migration
-- Seeds role_skill_requirements for the 3 supported roles using existing canonical skills.

WITH target_roles AS (
  SELECT id, slug FROM roles
  WHERE slug IN ('frontend-engineer', 'react-developer', 'nextjs-developer')
),
target_skills AS (
  SELECT id, slug FROM skills
)
INSERT INTO role_skill_requirements (role_id, skill_id, importance)
SELECT r.id, s.id, req.importance
FROM (
  VALUES
    -- Frontend Engineer
    ('frontend-engineer', 'react',        'required'),
    ('frontend-engineer', 'javascript',   'required'),
    ('frontend-engineer', 'html',         'required'),
    ('frontend-engineer', 'css',          'required'),
    ('frontend-engineer', 'typescript',   'important'),
    ('frontend-engineer', 'git',          'important'),
    ('frontend-engineer', 'rest-apis',    'important'),
    ('frontend-engineer', 'jest',         'optional'),
    
    -- React Developer
    ('react-developer', 'react',        'required'),
    ('react-developer', 'javascript',   'required'),
    ('react-developer', 'html',         'required'),
    ('react-developer', 'css',          'required'),
    ('react-developer', 'react-query',  'important'),
    ('react-developer', 'redux',        'optional'),
    ('react-developer', 'jest',         'optional'),
    ('react-developer', 'typescript',   'optional'),

    -- Next.js Developer
    ('nextjs-developer', 'nextjs',       'required'),
    ('nextjs-developer', 'react',        'required'),
    ('nextjs-developer', 'typescript',   'required'),
    ('nextjs-developer', 'tailwind-css', 'important'),
    ('nextjs-developer', 'git',          'important'),
    ('nextjs-developer', 'nodejs',       'optional')
) AS req(role_slug, skill_slug, importance)
JOIN target_roles r ON r.slug = req.role_slug
JOIN target_skills s ON s.slug = req.skill_slug
ON CONFLICT (role_id, skill_id) 
DO UPDATE SET importance = EXCLUDED.importance;
