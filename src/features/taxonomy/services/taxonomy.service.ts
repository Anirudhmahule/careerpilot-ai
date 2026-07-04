import { supabase } from '@/lib/supabase';
import type {
  EvidenceOccurrence,
  TaxonomyResult,
  TaxonomyServiceError,
  ResumeAnalysisLike,
} from '../types/taxonomy.types';

// ─── Error normaliser ─────────────────────────────────────────────────────────

function normalizeTaxonomyError(err: unknown): TaxonomyServiceError {
  if (err !== null && typeof err === 'object') {
    const candidate = err as Record<string, unknown>;
    const message =
      typeof candidate['message'] === 'string'
        ? candidate['message']
        : 'An unexpected taxonomy error occurred.';
    const code =
      typeof candidate['code'] === 'string' ? candidate['code'] : undefined;
    return { message, code };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: 'An unexpected taxonomy error occurred.' };
}

// ─── Service interface ────────────────────────────────────────────────────────

export interface ITaxonomyService {
  /**
   * Pure deterministic aggregation of raw technologies/skills from a ResumeAnalysis.
   * Does not perform deduplication. Returns newly constructed EvidenceOccurrence objects.
   */
  aggregateEvidenceOccurrences(analysis: ResumeAnalysisLike): EvidenceOccurrence[];

  /**
   * Resolves raw names against the deployed taxonomy using exact deterministic alias matching.
   * Mutates nothing. Returns a new array of occurrences with normalizedSkillId populated.
   */
  resolveEvidenceOccurrences(
    occurrences: EvidenceOccurrence[]
  ): Promise<TaxonomyResult<EvidenceOccurrence[]>>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

class TaxonomyService implements ITaxonomyService {
  aggregateEvidenceOccurrences(analysis: ResumeAnalysisLike): EvidenceOccurrence[] {
    const occurrences: EvidenceOccurrence[] = [];

    // 1. Top-level skills
    if (analysis.skills && Array.isArray(analysis.skills)) {
      for (const skill of analysis.skills) {
        occurrences.push({
          rawName: skill.name,
          normalizedSkillId: null,
          sourceType: 'skill',
          sourceEntityId: skill.id,
          evidence: [...skill.evidence],
          evidenceKind: 'exact',
        });
      }
    }

    // 2. Experience technologies
    if (analysis.experience && Array.isArray(analysis.experience)) {
      for (const exp of analysis.experience) {
        if (exp.technologies && Array.isArray(exp.technologies)) {
          for (const tech of exp.technologies) {
            occurrences.push({
              rawName: tech,
              normalizedSkillId: null,
              sourceType: 'experience',
              sourceEntityId: exp.id,
              evidence: [...exp.evidence],
              evidenceKind: 'contextual',
            });
          }
        }
      }
    }

    // 3. Project technologies
    if (analysis.projects && Array.isArray(analysis.projects)) {
      for (const proj of analysis.projects) {
        if (proj.technologies && Array.isArray(proj.technologies)) {
          for (const tech of proj.technologies) {
            occurrences.push({
              rawName: tech,
              normalizedSkillId: null,
              sourceType: 'project',
              sourceEntityId: proj.id,
              evidence: [...proj.evidence],
              evidenceKind: 'contextual',
            });
          }
        }
      }
    }

    return occurrences;
  }

  async resolveEvidenceOccurrences(
    occurrences: EvidenceOccurrence[]
  ): Promise<TaxonomyResult<EvidenceOccurrence[]>> {
    if (occurrences.length === 0) {
      return { data: [], error: null };
    }

    try {
      // 1. Collect unique normalized raw names
      const uniqueNamesSet = new Set<string>();
      for (const occ of occurrences) {
        const normalized = occ.rawName.trim().toLowerCase();
        if (normalized) {
          uniqueNamesSet.add(normalized);
        }
      }

      const uniqueNames = Array.from(uniqueNamesSet);
      if (uniqueNames.length === 0) {
        // No valid names to lookup, just return clones
        return { data: occurrences.map((o) => ({ ...o })), error: null };
      }

      // 2. Batch query canonical skills
      const { data: canonicalSkills, error: canonicalError } = await supabase
        .from('skills')
        .select('id, normalized_name')
        .in('normalized_name', uniqueNames);

      if (canonicalError) {
        return { data: null, error: normalizeTaxonomyError(canonicalError) };
      }

      // 3. Batch query explicit aliases
      const { data: aliases, error: aliasError } = await supabase
        .from('skill_aliases')
        .select('skill_id, normalized_alias')
        .in('normalized_alias', uniqueNames);

      if (aliasError) {
        return { data: null, error: normalizeTaxonomyError(aliasError) };
      }

      // 4. Build in-memory resolution maps
      const canonicalMap = new Map<string, string>();
      if (canonicalSkills) {
        for (const row of canonicalSkills) {
          canonicalMap.set(row.normalized_name, row.id);
        }
      }

      const aliasMap = new Map<string, string>();
      if (aliases) {
        for (const row of aliases) {
          aliasMap.set(row.normalized_alias, row.skill_id);
        }
      }

      // 5. Check for cross-table ambiguity (integrity check)
      for (const name of uniqueNames) {
        const canonicalId = canonicalMap.get(name);
        const aliasId = aliasMap.get(name);
        
        if (canonicalId && aliasId && canonicalId !== aliasId) {
          return {
            data: null,
            error: {
              message: `Taxonomy integrity failure: Ambiguous resolution for "${name}". Canonical skill ID differs from explicit alias skill ID.`,
            },
          };
        }
      }

      // 6. Enrich occurrences
      const resolvedOccurrences = occurrences.map((occ) => {
        const normalized = occ.rawName.trim().toLowerCase();
        
        // canonical exact normalized-name match THEN explicit alias match
        let resolvedId: string | null = null;
        if (canonicalMap.has(normalized)) {
          resolvedId = canonicalMap.get(normalized)!;
        } else if (aliasMap.has(normalized)) {
          resolvedId = aliasMap.get(normalized)!;
        }

        return {
          ...occ,
          normalizedSkillId: resolvedId,
        };
      });

      return { data: resolvedOccurrences, error: null };
    } catch (err) {
      return { data: null, error: normalizeTaxonomyError(err) };
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const taxonomyService: ITaxonomyService = new TaxonomyService();
