import { Candidate, Job, MatchResult } from "../types";

const API_URL = "http://127.0.0.1:8000";

export const fetchJobMatches = async (
  candidate: Candidate,
  jobs: Job[]
): Promise<MatchResult[]> => {
  try {
    // 1. Format payload to match Python Pydantic models
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

    // 2. Call API
    const response = await fetch(`${API_URL}/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to fetch matches");

    const data = await response.json();

    // 3. Merge API results with original Job objects
    // (API returns ID/Score, but UI needs full Job Details)
    const processedMatches: MatchResult[] = data.matches.map((m: any) => {
      const originalJob = jobs.find((j) => j.job_id === m.job_id);
      return {
        job_id: m.job_id,
        job_details: originalJob, // <--- IMPORTANT: Re-attach job details
        match_score: m.match_score,
        breakdown: m.breakdown,
        missing_skills: m.missing_skills,
        recommendation_reason: m.recommendation_reason,
      };
    });

    return processedMatches;
  } catch (error) {
    console.error("Matching API Error, falling back to empty:", error);
    return [];
  }
};
