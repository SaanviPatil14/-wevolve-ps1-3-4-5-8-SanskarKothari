export type UserRole = 'candidate' | 'employer';

export interface Education {
  degree: string;
  field: string;
  cgpa: string | number;
}

export interface Candidate {
  id: string; // or uid
  name: string;
  email?: string;
  bio?: string;
  skills: string[];
  experience_years: number;
  expected_salary: number;
  preferred_locations: string[];
  preferred_roles: string[];
  education: Education;
  contact_email?: string;
  contact_phone?: string;
  avatar?: string;
  address?: string;
}

export interface Job {
  job_id: string;
  title: string;
  company: string;
  location: string;
  required_skills: string[];
  experience_required: string;
  salary_range: number[]; // [min, max]
}

export interface MatchBreakdown {
  skill_match?: number;      // 0-100
  location_match?: number;   // 0-100
  salary_match?: number;     // 0-100
  experience_match?: number; // 0-100
  role_match?: number;       // 0-100
}

export interface MatchResult {
  match_score: number;        // 0-100 overall score
  candidate_id?: string;
  job_id?: string;
  matching_skills?: string[]; // Skills candidate has that job needs
  missing_skills?: string[];  // Skills job needs that candidate doesn't have
  recommendation_reason?: string; // AI-friendly explanation
  breakdown?: MatchBreakdown;  // Individual factor scores
  // Populated details
  candidate_details?: Candidate;
  job_details?: Job;
  explanation?: string;       // User-friendly explanation
}