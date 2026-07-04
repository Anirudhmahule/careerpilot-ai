import type { RequirementImportance } from '../../taxonomy/types/taxonomy.types';

export type RoleRequirementFingerprintInput = {
  readonly skillId: string;
  readonly importance: RequirementImportance;
};

export const ROLE_REQUIREMENTS_FINGERPRINT_VERSION = 'v1-sha256-skill-id-importance';

/**
 * Returns a purely deterministic canonical string representation of a set of role requirements.
 * Duplicates by skillId are rejected to prevent invalid source state from silently passing.
 */
export function canonicalizeRoleRequirements(
  requirements: readonly RoleRequirementFingerprintInput[]
): string {
  const seenSkillIds = new Set<string>();
  const normalized: Array<[string, RequirementImportance]> = [];

  for (const req of requirements) {
    if (seenSkillIds.has(req.skillId)) {
      throw new Error(`Duplicate skillId found in role requirements: ${req.skillId}`);
    }
    seenSkillIds.add(req.skillId);
    // Explicitly mapping just skillId and importance to prevent other fields from bleeding in
    normalized.push([req.skillId, req.importance]);
  }

  // Sort deterministically using code-unit ordering (< or >) instead of localeCompare
  normalized.sort((a, b) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
    return 0;
  });

  return JSON.stringify(normalized);
}

/**
 * Returns the SHA-256 lowercase hex digest of the canonicalized requirements.
 * Uses Web Crypto for cross-environment stability (Browser & Edge).
 */
export async function fingerprintRoleRequirements(
  requirements: readonly RoleRequirementFingerprintInput[]
): Promise<string> {
  const canonicalString = canonicalizeRoleRequirements(requirements);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalString);

  // Web Crypto is available in both standard browsers and modern Edge runtimes (Deno, Cloudflare Workers, etc.)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hex;
}
