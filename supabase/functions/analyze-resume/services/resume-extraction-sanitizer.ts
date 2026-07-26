import { ResumeExtraction } from "../types/resume-analysis.types.ts";

export class ResumeExtractionSanitizer {
  private static readonly NON_TECHNICAL_SKILLS = new Set([
    "cross-functional collaboration",
    "communication",
    "teamwork",
    "leadership",
    "stakeholder management",
    "problem solving",
    "collaboration"
  ]);

  private static normalizeForComparison(text: string | null | undefined): string {
    if (!text) return "";
    return text.toLowerCase()
      .replace(/[^\w\s]/g, "") // remove punctuation separators
      .replace(/\s+/g, " ")     // collapse whitespace
      .trim();
  }

  public static sanitize(extraction: ResumeExtraction): ResumeExtraction {
    // 1. Skill sanitation
    const sanitizedSkills = extraction.skills.filter(skill => {
      const normalized = skill.name.toLowerCase().replace(/\s+/g, " ").trim();
      return !this.NON_TECHNICAL_SKILLS.has(normalized);
    });

    // 2. Education/Certification duplicate sanitation
    const educationEntries = extraction.education.map(ed => ({
      normalizedInstitution: this.normalizeForComparison(ed.institution),
      normalizedDegreeField: this.normalizeForComparison(`${ed.degree || ""} ${ed.field || ""}`)
    }));

    const sanitizedCertifications = extraction.certifications.filter(cert => {
      const normalizedIssuer = this.normalizeForComparison(cert.issuer);
      const normalizedName = this.normalizeForComparison(cert.name);

      const isDuplicate = educationEntries.some(ed => {
        if (!normalizedIssuer || !ed.normalizedInstitution) return false;
        
        const issuerMatches = ed.normalizedInstitution === normalizedIssuer;
        if (!issuerMatches) return false;

        if (!ed.normalizedDegreeField) return false;

        const certTokens = new Set(normalizedName.split(" ").filter(Boolean));
        const edTokens = ed.normalizedDegreeField.split(" ").filter(Boolean);
        
        if (edTokens.length === 0) return false;
        
        // Check if certification name substantially corresponds to combined degree + field
        // using deterministic token containment
        const tokensContained = edTokens.every(token => certTokens.has(token));
        
        return tokensContained;
      });

      return !isDuplicate;
    });

    // Return a new object to ensure input immutability
    return {
      ...extraction,
      skills: sanitizedSkills,
      certifications: sanitizedCertifications
    };
  }
}
