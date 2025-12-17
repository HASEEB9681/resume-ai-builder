export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface Language {
  id: string;
  language: string;
  proficiency: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  website: string;
  location: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  skills: string; // Comma separated for input
}

export interface GeneratedResume {
  professionalSummary: string;
  enhancedExperience: {
    id: string;
    bullets: string[];
  }[];
  enhancedProjects: {
    id: string;
    bullets: string[];
  }[];
  skillsList: string[];
}

export interface MatchResult {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
}

export enum ResumeStyle {
  MODERN = 'modern',
  CLASSIC = 'classic',
  MINIMAL = 'minimal',
  PREMIUM_DARK = 'premium_dark',
  PREMIUM_CREATIVE = 'premium_creative'
}