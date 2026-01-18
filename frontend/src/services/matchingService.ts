import { Candidate, Job, MatchResult } from "../types";

const API_URL = "http://127.0.0.1:8000";

/**
 * Fetch job matches from the Python backend matching engine
 * Uses the new multi-factor weighted scoring algorithm
 * @param candidate - The candidate profile
 * @param jobs - Array of jobs to match against
 * @returns Array of MatchResult with detailed breakdown
 */
export const fetchJobMatches = async (
  candidate: Candidate,
  jobs: Job[]
): Promise<MatchResult[]> => {
  try {
    // 1. Format payload to match Python Pydantic models
    // Maps frontend Candidate/Job to backend CandidateMatchProfile/JobPostingForMatch
    const payload = {
      candidate: {
        skills: candidate.skills || [],
        experience_years: candidate.experience_years || 0,
        preferred_locations: candidate.preferred_locations || [],
        preferred_roles: candidate.preferred_roles || [],
        expected_salary: candidate.expected_salary || 0,
        education: candidate.education || { degree: "", field: "", cgpa: 0 },
      },
      jobs: jobs.map((j) => ({
        job_id: j.job_id,
        title: j.title,
        required_skills: j.required_skills || [],
        experience_required: j.experience_required || "0-1 years",
        location: j.location,
        salary_range: j.salary_range || [0, 0],
        company: j.company,
      })),
    };

    // 2. Call the new multi-factor matching endpoint
    const response = await fetch(`${API_URL}/api/match/candidate-to-jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch matches");
    }

    const data = await response.json();

    // 3. Merge API results with original Job objects
    // API returns scores and breakdown, but we need full Job Details for UI
    const processedMatches: MatchResult[] = data.matches.map((m: any) => {
      const originalJob = jobs.find((j) => j.job_id === m.job_id);
      return {
        job_id: m.job_id,
        job_details: originalJob,
        candidate_id: candidate.id,
        match_score: m.match_score,
        matching_skills: m.matching_skills || [],
        missing_skills: m.missing_skills || [],
        recommendation_reason: m.recommendation_reason || "",
        breakdown: m.breakdown || {},
        explanation: `Match score: ${m.match_score}%. ${m.recommendation_reason || ""}`,
      };
    });

    return processedMatches;
  } catch (error) {
    console.error("Matching API Error:", error);
    // Return empty array on error - UI will show "No matches"
    return [];
  }
};

/**
 * Fetch current matching engine weights/configuration
 * Useful for displaying algorithm transparency
 */
export const fetchMatchingWeights = async () => {
  try {
    const response = await fetch(`${API_URL}/api/match/engine/weights`);
    if (!response.ok) throw new Error("Failed to fetch weights");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch weights:", error);
    return {
      skill_weight: 0.4,
      location_weight: 0.2,
      salary_weight: 0.15,
      experience_weight: 0.15,
      role_weight: 0.1,
    };
  }
};
