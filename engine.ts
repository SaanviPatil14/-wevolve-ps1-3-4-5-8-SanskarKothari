import { Candidate, Job, MatchResult, DEFAULT_WEIGHTS, WeightConfig } from './types';

export const calculateMatch = (
  candidate: Candidate,
  job: Job,
  weights: WeightConfig = DEFAULT_WEIGHTS
): MatchResult => {

  /* -----------------------------
     1. Skill Match (40%)
  ------------------------------ */

  const candidateSkills = Array.isArray(candidate.skills)
    ? candidate.skills.map(s => s.toLowerCase())
    : [];

  const jobSkills = Array.isArray(job.required_skills)
    ? job.required_skills.map(s => s.toLowerCase())
    : [];

  const matchedSkills = jobSkills.filter(skill =>
    candidateSkills.includes(skill)
  );

  const missingSkills = jobSkills.filter(skill =>
    !candidateSkills.includes(skill)
  );

  const skill_match =
    jobSkills.length > 0
      ? (matchedSkills.length / jobSkills.length) * 100
      : 100;

  /* -----------------------------
     2. Location Match (20%)
  ------------------------------ */

  const preferredLocations = Array.isArray(candidate.preferred_locations)
    ? candidate.preferred_locations
    : [];

  const location_match = preferredLocations.some(
    loc => loc.toLowerCase() === job.location?.toLowerCase()
  )
    ? 100
    : 0;

  /* -----------------------------
     3. Salary Match (15%)
  ------------------------------ */

  let salary_match = 0;

  if (
    Array.isArray(job.salary_range) &&
    job.salary_range.length === 2
  ) {
    const [minSalary, maxSalary] = job.salary_range;

    if (candidate.expected_salary <= maxSalary) {
      salary_match = 100;
    } else {
      const diff = candidate.expected_salary - maxSalary;
      salary_match = Math.max(0, 100 - (diff / maxSalary) * 100);
    }
  }

  /* -----------------------------
     4. Experience Match (15%)
  ------------------------------ */

  let experience_match = 0;

  if (job.experience_required) {
    const expRange = job.experience_required.match(/(\d+)/g);

    if (expRange) {
      const minExp = parseInt(expRange[0], 10);
      const maxExp = expRange[1] ? parseInt(expRange[1], 10) : Infinity;

      if (
        candidate.experience_years >= minExp &&
        candidate.experience_years <= maxExp
      ) {
        experience_match = 100;
      } else if (candidate.experience_years > maxExp) {
        experience_match = 90;
      } else if (minExp > 0) {
        experience_match = (candidate.experience_years / minExp) * 100;
      }
    }
  }

  /* -----------------------------
     5. Role Match (10%)
  ------------------------------ */

  const preferredRoles = Array.isArray(candidate.preferred_roles)
    ? candidate.preferred_roles
    : [];

  const role_match = preferredRoles.some(
    role => role.toLowerCase() === job.title?.toLowerCase()
  )
    ? 100
    : 50;

  /* -----------------------------
     Final Weighted Score
  ------------------------------ */

  const match_score = Number(
    (
      skill_match * weights.skill +
      location_match * weights.location +
      salary_match * weights.salary +
      experience_match * weights.experience +
      role_match * weights.role
    ).toFixed(2)
  );

  return {
    job_id: job.job_id,
    job_details: job,
    match_score,
    breakdown: {
      skill_match,
      location_match,
      salary_match,
      experience_match,
      role_match
    },
    missing_skills: missingSkills,
    recommendation_reason: `Calculated match score of ${match_score}% based on weighted compatibility factors.`
  };
};
