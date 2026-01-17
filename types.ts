export type UserRole = "candidate" | "employer";

export interface Education {
  college: string;
  degree: string;
  field: string;
  cgpa: number;
}

export interface Candidate {
  id: string;
  name: string;
  current_role?: string;
  contact_email?: string;
  contact_phone?: string;
  address: string;
  bio?: string;
  skills: string[];
  experience_years: number;
  preferred_locations: string[];
  preferred_roles: string[];
  expected_salary: number;
  education: Education;
  avatar?: string;
  photoURL?: string;
}

export interface Job {
  job_id: string;
  title: string;
  required_skills: string[];
  description: string;
  experience_required: string;
  location: string;
  salary_range: [number, number];
  company: string;
}

// --- Matching Engine Types ---
export interface MatchBreakdown {
  skill_match: number;
  location_match: number;
  salary_match: number;
  experience_match: number;
  role_match: number;
}

export interface MatchResult {
  job_id?: string;
  candidate_id?: string;
  job_details?: Job;
  candidate_details?: Candidate;
  match_score: number;
  breakdown: MatchBreakdown;
  missing_skills: string[];
  recommendation_reason: string;
}

// --- Skills Gap & Salary Analysis Types ---
export interface RoadmapPhase {
  phase: number;
  duration_months: number;
  focus: string;
  skills_to_learn: string[];
  priority: string;
  reasoning: string;
}

export interface RadarDataPoint {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

export interface GapAnalysisMetrics {
  matching_skills: string[];
  missing_skills: string[];
  skill_gap_percentage: number;
  readiness_score: number;
  estimated_learning_time_months: number;
}

// ▼▼▼ NEW INTERFACE FOR SALARY ▼▼▼
export interface SalaryPoint {
  year: string;
  salary: number;
  role: string;
}

export interface SkillGapAnalysisResult {
  analysis: GapAnalysisMetrics;
  learning_roadmap: RoadmapPhase[];
  radar_data: RadarDataPoint[];
  salary_growth?: SalaryPoint[]; // <--- ADDED
}
