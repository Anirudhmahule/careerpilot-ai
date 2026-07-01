export type SnapshotStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AnalyzeResumeCommand {
  analysisSnapshotId: string;
  storagePath: string;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface ResumeExtractionResult {
  text: string;
  pageCount: number;
  info: PdfMetadata | null;
  metadata: Record<string, unknown> | null;
}

export interface AnalyzeResumeResponse {
  analysis: ResumeAnalysis;
}

export interface Achievement {
  id: string;
  title: string;
  description: string | null;
  evidence: string[];
}

export interface Warning {
  code: string;
  message: string;
}

export interface ResumeAnalysis {
  metadata: AnalysisMetadata;
  personal: PersonalInformation;
  summary: Summary;
  skills: Skill[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  achievements: Achievement[];
  languages: Language[];
  links: Links;
  missingInformation: MissingInformation[];
  warnings: Warning[];
}

export interface AnalysisMetadata {
  parserVersion: string;
  promptVersion: string;
  language: string | null;
}

export interface PersonalInformation {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  currentTitle: string | null;
}

export interface Summary {
  text: string | null;
}

export interface Skill {
  id: string;
  name: string;
  normalizedName: string;
  confidence: number;
  evidence: string[];
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  employmentType: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  responsibilities: string[];
  achievements: Achievement[];
  technologies: string[];
  evidence: string[];
}

export interface Project {
  id: string;
  name: string;
  role: string | null;
  description: string | null;
  technologies: string[];
  features: string[];
  github: string | null;
  liveDemo: string | null;
  evidence: string[];
}

export interface Education {
  institution: string;
  degree: string | null;
  field: string | null;
  cgpa: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string | null;
  issueDate: string | null;
  credentialUrl: string | null;
}

export interface Language {
  name: string;
  proficiency: string | null;
}

export interface Links {
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  website: string | null;
}

export interface MissingInformation {
  field: string;
  reason: string;
}
