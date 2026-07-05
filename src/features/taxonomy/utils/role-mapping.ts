import type { TaxonomyRoleSlug } from '../types/taxonomy.types';

export type RoleMappingResult = 
  | { supported: true; slug: TaxonomyRoleSlug }
  | { supported: false; role: string | null };

/**
 * Safely maps a human-readable Journey target_role string to a deterministic
 * taxonomy role slug. Rejects legacy or unknown roles explicitly.
 *
 * DO NOT use generic slugification (e.g. toLowerCase().replace(/\s+/g, '-')).
 * We must only map known, supported values to prevent silent taxonomy failures.
 */
export function mapTargetRoleToTaxonomySlug(
  targetRole: string | null | undefined
): RoleMappingResult {
  if (!targetRole) {
    return { supported: false, role: null };
  }

  // Exact matching against known supported Journey roles
  switch (targetRole) {
    case 'Frontend Engineer':
      return { supported: true, slug: 'frontend-engineer' };
    case 'React Developer':
      return { supported: true, slug: 'react-developer' };
    case 'Next.js Developer':
      return { supported: true, slug: 'nextjs-developer' };
    default:
      // Includes legacy 'Software Engineer', 'Backend Engineer', and anything else
      return { supported: false, role: targetRole };
  }
}
