"""
Multi-Factor Job Matching Engine
Implements weighted scoring algorithm for job-candidate compatibility
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
import re


# ============================================================================
# PYDANTIC MODELS FOR JOB MATCHING
# ============================================================================

class EducationModel(BaseModel):
    """Candidate education details"""
    degree: Optional[str] = None
    field: Optional[str] = None
    cgpa: Optional[float] = None


class CandidateMatchProfile(BaseModel):
    """Candidate profile for matching"""
    skills: List[str]
    experience_years: int
    preferred_locations: List[str]
    preferred_roles: List[str]
    expected_salary: float
    education: Optional[EducationModel] = None


class JobPostingForMatch(BaseModel):
    """Job posting for matching"""
    job_id: str
    title: str
    required_skills: List[str]
    experience_required: str  # e.g., "0-2 years", "2-5 years"
    location: str
    salary_range: List[float]  # [min, max]
    company: str
    description: Optional[str] = None


class MatchBreakdown(BaseModel):
    """Detailed breakdown of match scores"""
    skill_match: float
    location_match: float
    salary_match: float
    experience_match: float
    role_match: float


class JobMatchResult(BaseModel):
    """Result of matching a candidate to a job"""
    job_id: str
    job_title: str
    company: str
    match_score: float
    breakdown: MatchBreakdown
    missing_skills: List[str]
    matching_skills: List[str]
    recommendation_reason: str


class MatchingRequest(BaseModel):
    """Request payload for matching"""
    candidate: CandidateMatchProfile
    jobs: List[JobPostingForMatch]


class MatchingResponse(BaseModel):
    """Response with ranked job matches"""
    matches: List[JobMatchResult]
    total_matches: int


# ============================================================================
# MATCHING ENGINE IMPLEMENTATION
# ============================================================================

class JobMatchingEngine:
    """
    Implements weighted job-candidate matching algorithm
    
    Weights:
    - Skill Match: 40%
    - Location Match: 20%
    - Salary Match: 15%
    - Experience Match: 15%
    - Role Match: 10%
    """
    
    # Weight configuration
    WEIGHTS = {
        'skill': 0.40,
        'location': 0.20,
        'salary': 0.15,
        'experience': 0.15,
        'role': 0.10
    }
    
    def __init__(self):
        self.skill_taxonomy = self._build_skill_taxonomy()
    
    def _build_skill_taxonomy(self) -> Dict[str, Dict[str, Any]]:
        """Build skill taxonomy for matching"""
        return {
            'python': {'category': 'Backend', 'aliases': ['py']},
            'fastapi': {'category': 'Backend', 'aliases': ['fast-api']},
            'django': {'category': 'Backend', 'aliases': []},
            'nodejs': {'category': 'Backend', 'aliases': ['node', 'node.js']},
            'javascript': {'category': 'Frontend', 'aliases': ['js']},
            'react': {'category': 'Frontend', 'aliases': ['react.js']},
            'typescript': {'category': 'Frontend', 'aliases': ['ts']},
            'postgresql': {'category': 'Database', 'aliases': ['postgres', 'pg']},
            'mongodb': {'category': 'Database', 'aliases': []},
            'docker': {'category': 'DevOps', 'aliases': []},
            'kubernetes': {'category': 'DevOps', 'aliases': ['k8s']},
            'aws': {'category': 'Cloud', 'aliases': []},
            'gcp': {'category': 'Cloud', 'aliases': ['google cloud']},
            'azure': {'category': 'Cloud', 'aliases': []},
            'git': {'category': 'Tools', 'aliases': []},
        }
    
    def normalize_skill(self, skill: str) -> str:
        """Normalize skill name for comparison"""
        normalized = skill.lower().strip()
        
        # Check direct taxonomy match
        if normalized in self.skill_taxonomy:
            return normalized
        
        # Check aliases
        for skill_key, skill_data in self.skill_taxonomy.items():
            if normalized in skill_data['aliases']:
                return skill_key
        
        return normalized
    
    def calculate_skill_match(self, candidate_skills: List[str], required_skills: List[str]) -> tuple:
        """
        Calculate skill match percentage
        Returns: (score, matching_skills, missing_skills)
        """
        if not required_skills:
            return 100.0, [], []
        
        # Normalize all skills
        candidate_normalized = set(self.normalize_skill(s) for s in candidate_skills)
        required_normalized = set(self.normalize_skill(s) for s in required_skills)
        
        # Find matches
        matching = candidate_normalized.intersection(required_normalized)
        missing = required_normalized - candidate_normalized
        
        # Calculate percentage
        match_percentage = (len(matching) / len(required_normalized)) * 100 if required_normalized else 100.0
        
        return match_percentage, list(matching), list(missing)
    
    def calculate_location_match(self, preferred_locations: List[str], job_location: str) -> float:
        """
        Calculate location match percentage
        Returns: score (0-100)
        """
        if not preferred_locations:
            return 50.0  # Neutral if no preference
        
        # Normalize location strings
        job_loc_normalized = job_location.lower().strip()
        preferred_normalized = [loc.lower().strip() for loc in preferred_locations]
        
        # Check exact match
        if job_loc_normalized in preferred_normalized:
            return 100.0
        
        # Check partial match (e.g., "Remote" or city name match)
        if job_loc_normalized == 'remote' or 'remote' in preferred_normalized:
            return 100.0
        
        return 0.0  # No match
    
    def parse_experience_range(self, experience_str: str) -> tuple:
        """
        Parse experience range string
        Returns: (min_years, max_years)
        """
        # Handle various formats: "0-2 years", "2-5 yrs", "5+ years", "3 years"
        experience_str = experience_str.lower().strip()
        
        # Extract numbers
        numbers = re.findall(r'\d+', experience_str)
        
        if not numbers:
            return 0, 99
        
        if len(numbers) == 1:
            # Single number - could be exact or minimum
            if '+' in experience_str:
                return int(numbers[0]), 99
            else:
                return int(numbers[0]), int(numbers[0])
        
        return int(numbers[0]), int(numbers[1])
    
    def calculate_experience_match(self, candidate_experience: int, experience_required: str) -> float:
        """
        Calculate experience match percentage
        Returns: score (0-100)
        """
        min_required, max_required = self.parse_experience_range(experience_required)
        
        if candidate_experience < min_required:
            # Below minimum - score based on how close
            return (candidate_experience / min_required) * 100 if min_required > 0 else 100.0
        elif candidate_experience <= max_required:
            # Within range - perfect match
            return 100.0
        else:
            # Above maximum - still good but slightly lower (overqualified)
            return 90.0
    
    def calculate_salary_match(self, expected_salary: float, salary_range: List[float]) -> float:
        """
        Calculate salary match percentage
        Returns: score (0-100)
        """
        if not salary_range or len(salary_range) < 2:
            return 50.0  # Neutral if no salary info
        
        min_salary, max_salary = salary_range[0], salary_range[1]
        
        # Handle zero or invalid salary range
        if max_salary <= 0:
            return 50.0  # Neutral if invalid salary range
        
        if expected_salary < min_salary:
            # Below range - candidate expects less (good for employer, decent match)
            return 100.0
        elif expected_salary <= max_salary:
            # Within range - perfect match
            return 100.0
        else:
            # Above range - candidate expects more
            excess = expected_salary - max_salary
            excess_percentage = (excess / max_salary) * 100
            return max(0, 100 - excess_percentage)
    
    def calculate_role_match(self, preferred_roles: List[str], job_title: str) -> float:
        """
        Calculate role match percentage
        Returns: score (0-100)
        """
        if not preferred_roles:
            return 50.0  # Neutral if no preference
        
        job_title_lower = job_title.lower().strip()
        
        # Direct match
        for role in preferred_roles:
            if role.lower().strip() == job_title_lower:
                return 100.0
        
        # Partial match
        for role in preferred_roles:
            role_lower = role.lower().strip()
            if role_lower in job_title_lower or job_title_lower in role_lower:
                return 80.0
        
        # No match
        return 0.0
    
    def calculate_overall_score(self, breakdown: MatchBreakdown) -> float:
        """Calculate weighted overall score"""
        return (
            breakdown.skill_match * self.WEIGHTS['skill'] +
            breakdown.location_match * self.WEIGHTS['location'] +
            breakdown.salary_match * self.WEIGHTS['salary'] +
            breakdown.experience_match * self.WEIGHTS['experience'] +
            breakdown.role_match * self.WEIGHTS['role']
        )
    
    def match_candidate_to_job(
        self, 
        candidate: CandidateMatchProfile, 
        job: JobPostingForMatch
    ) -> JobMatchResult:
        """
        Match a single candidate to a job
        Returns: JobMatchResult with scores and breakdown
        """
        # Calculate individual scores
        skill_score, matching_skills, missing_skills = self.calculate_skill_match(
            candidate.skills, 
            job.required_skills
        )
        
        location_score = self.calculate_location_match(
            candidate.preferred_locations, 
            job.location
        )
        
        salary_score = self.calculate_salary_match(
            candidate.expected_salary, 
            job.salary_range
        )
        
        experience_score = self.calculate_experience_match(
            candidate.experience_years, 
            job.experience_required
        )
        
        role_score = self.calculate_role_match(
            candidate.preferred_roles, 
            job.title
        )
        
        # Create breakdown
        breakdown = MatchBreakdown(
            skill_match=round(skill_score, 2),
            location_match=round(location_score, 2),
            salary_match=round(salary_score, 2),
            experience_match=round(experience_score, 2),
            role_match=round(role_score, 2)
        )
        
        # Calculate overall score
        overall_score = self.calculate_overall_score(breakdown)
        
        # Generate recommendation reason
        if len(matching_skills) == len(job.required_skills):
            reason = f"Perfect skill alignment with {len(matching_skills)}/{len(job.required_skills)} matching skills."
        elif len(matching_skills) == 0:
            reason = f"No skill matches. Missing {len(missing_skills)} required skills."
        else:
            reason = f"Strong skill alignment with {len(matching_skills)}/{len(job.required_skills)} matching skills."
        
        if location_score == 100:
            reason += " Preferred location match."
        
        return JobMatchResult(
            job_id=job.job_id,
            job_title=job.title,
            company=job.company,
            match_score=round(overall_score, 2),
            breakdown=breakdown,
            missing_skills=missing_skills,
            matching_skills=matching_skills,
            recommendation_reason=reason
        )
    
    def match_candidate_to_jobs(
        self, 
        candidate: CandidateMatchProfile, 
        jobs: List[JobPostingForMatch]
    ) -> MatchingResponse:
        """
        Match candidate to multiple jobs and return ranked results
        Returns: MatchingResponse with sorted matches
        """
        matches = []
        
        for job in jobs:
            match_result = self.match_candidate_to_job(candidate, job)
            matches.append(match_result)
        
        # Sort by match score (descending)
        matches.sort(key=lambda x: x.match_score, reverse=True)
        
        return MatchingResponse(
            matches=matches,
            total_matches=len(matches)
        )


# Singleton instance
engine = JobMatchingEngine()
