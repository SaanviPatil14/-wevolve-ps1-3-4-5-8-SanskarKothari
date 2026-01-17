from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import re

app = FastAPI()

# --- CORS Config (Allows React to talk to Python) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load Taxonomy (Used for Skills Gap) ---
try:
    with open('taxonomy.json', 'r') as f:
        TAXONOMY = json.load(f)['skills']
except:
    TAXONOMY = {}

# ==========================================
#  FEATURE 1: SKILLS GAP ANALYSIS (+ Salary)
# ==========================================

class GapCandidateProfile(BaseModel):
    current_role: str
    current_skills: List[str]
    experience_years: int
    education: str = ""

class TargetRole(BaseModel):
    title: str
    required_skills: List[str]
    typical_experience: str

class GapAnalysisRequest(BaseModel):
    candidate: GapCandidateProfile
    target_role: TargetRole

# --- Helper: Calculate Salary Growth ---
def calculate_salary_growth(current_exp: int):
    # Base logic: completing the roadmap usually jumps salary by 30-50%
    base = 800000 # Mock base salary (8 LPA)
    
    # Simple linear growth model for visualization
    return [
        {"year": "Current", "salary": base, "role": "Junior Dev"},
        {"year": "Year 1", "salary": int(base * 1.35), "role": "Mid-Level Dev"},
        {"year": "Year 2", "salary": int(base * 1.6), "role": "Senior Dev"},
        {"year": "Year 3", "salary": int(base * 2.0), "role": "Tech Lead"}
    ]

def generate_radar_data(current, target):
    categories = {"Frontend": 0, "Backend": 0, "DevOps": 0, "Database": 0}
    target_counts = categories.copy()
    current_counts = categories.copy()
    
    for skill in target:
        cat = TAXONOMY.get(skill, {}).get("category", "Backend")
        if cat in target_counts: target_counts[cat] += 100
        
    for skill in current:
        cat = TAXONOMY.get(skill, {}).get("category", "Backend")
        if cat in current_counts: current_counts[cat] += 100

    data = []
    for cat in categories:
        data.append({
            "subject": cat,
            "A": current_counts[cat],
            "B": target_counts[cat],
            "fullMark": max(target_counts[cat], 100) + 50
        })
    return data

@app.post("/analyze")
async def analyze_gap(payload: GapAnalysisRequest):
    candidate = payload.candidate
    target = payload.target_role
    
    current_set = set(candidate.current_skills)
    required_set = set(target.required_skills)
    
    # 1. Gap Calculation
    matching = list(current_set.intersection(required_set))
    missing = list(required_set.difference(current_set))
    
    total_required = len(required_set)
    gap_pct = (len(missing) / total_required * 100) if total_required > 0 else 0
    
    # 2. Readiness Score
    base_score = (len(matching) / total_required * 50) if total_required > 0 else 0
    exp_score = min(candidate.experience_years * 10, 30)
    readiness = base_score + exp_score
    
    # 3. Roadmap Generation
    roadmap = []
    total_time = 0
    phase_counter = 1
    
    missing_skill_details = []
    for skill in missing:
        details = TAXONOMY.get(skill, {"category": "General", "time_months": 1, "difficulty": 1})
        details['name'] = skill
        missing_skill_details.append(details)
        total_time += details['time_months']

    # Sort by difficulty
    missing_skill_details.sort(key=lambda x: x.get('difficulty', 1))
    
    # Create phases
    chunk_size = 2
    for i in range(0, len(missing_skill_details), chunk_size):
        chunk = missing_skill_details[i:i+chunk_size]
        names = [s['name'] for s in chunk]
        duration = sum(s.get('time_months', 1) for s in chunk)
        cat = chunk[0].get('category', 'General')
        
        roadmap.append({
            "phase": phase_counter,
            "duration_months": round(duration, 1),
            "focus": f"Mastering {cat} Concepts",
            "skills_to_learn": names,
            "priority": "High" if phase_counter == 1 else "Medium",
            "reasoning": f"Foundational skills for {target.title}"
        })
        phase_counter += 1

    return {
        "analysis": {
            "matching_skills": matching,
            "missing_skills": missing,
            "skill_gap_percentage": round(gap_pct, 2),
            "readiness_score": round(readiness, 2),
            "estimated_learning_time_months": round(total_time, 1)
        },
        "learning_roadmap": roadmap,
        "radar_data": generate_radar_data(candidate.current_skills, target.required_skills),
        "salary_growth": calculate_salary_growth(candidate.experience_years) # <--- ADDED
    }


# ==========================================
#  FEATURE 2: MULTI-FACTOR JOB MATCHING
# ==========================================

class EducationModel(BaseModel):
    degree: str = ""
    field: str = ""
    cgpa: float = 0.0

class CandidateMatchProfile(BaseModel):
    skills: List[str]
    experience_years: int
    preferred_locations: List[str]
    preferred_roles: List[str]
    expected_salary: float
    education: Optional[EducationModel] = None

class JobPosting(BaseModel):
    job_id: str
    title: str
    required_skills: List[str]
    experience_required: str
    location: str
    salary_range: List[float] # [min, max]
    company: str

class MatchRequest(BaseModel):
    candidate: CandidateMatchProfile
    jobs: List[JobPosting]

def parse_experience(exp_str: str) -> tuple:
    nums = re.findall(r'\d+', exp_str)
    if not nums: return (0, 0)
    if len(nums) == 1: return (int(nums[0]), int(nums[0]))
    return (int(nums[0]), int(nums[1]))

def calculate_score(candidate: CandidateMatchProfile, job: JobPosting):
    # Weights
    W_SKILL = 0.40
    W_LOC = 0.20
    W_SALARY = 0.15
    W_EXP = 0.15
    W_ROLE = 0.10

    # 1. Skill Match
    job_skills = set(s.lower() for s in job.required_skills)
    cand_skills = set(s.lower() for s in candidate.skills)
    if not job_skills:
        skill_score = 100
    else:
        matches = job_skills.intersection(cand_skills)
        skill_score = (len(matches) / len(job_skills)) * 100

    # 2. Location Match
    loc_score = 0
    if any(l.lower() in job.location.lower() for l in candidate.preferred_locations):
        loc_score = 100
    elif not candidate.preferred_locations:
        loc_score = 50

    # 3. Salary Match
    salary_score = 0
    job_min = job.salary_range[0]
    job_max = job.salary_range[1] if len(job.salary_range) > 1 else job_min
    
    if candidate.expected_salary <= job_max:
        if candidate.expected_salary <= job_min:
            salary_score = 100
        else:
            salary_score = 80
    else:
        diff = candidate.expected_salary - job_max
        if diff < 200000: salary_score = 50
        else: salary_score = 0

    # 4. Experience Match
    exp_min, exp_max = parse_experience(job.experience_required)
    if exp_min <= candidate.experience_years <= exp_max + 1:
        exp_score = 100
    elif candidate.experience_years > exp_max + 1:
        exp_score = 80
    else:
        exp_score = 40

    # 5. Role Match
    role_score = 0
    if any(r.lower() in job.title.lower() for r in candidate.preferred_roles):
        role_score = 100
    
    final_score = (
        (skill_score * W_SKILL) +
        (loc_score * W_LOC) +
        (salary_score * W_SALARY) +
        (exp_score * W_EXP) +
        (role_score * W_ROLE)
    )

    missing = [s for s in job.required_skills if s.lower() not in cand_skills]

    return {
        "job_id": job.job_id,
        "match_score": round(final_score, 1),
        "breakdown": {
            "skill_match": round(skill_score),
            "location_match": round(loc_score),
            "salary_match": round(salary_score),
            "experience_match": round(exp_score),
            "role_match": round(role_score)
        },
        "missing_skills": missing,
        "recommendation_reason": generate_reason(final_score, len(missing))
    }

def generate_reason(score, missing_count):
    if score > 85: return "Excellent match across all criteria."
    if missing_count == 0: return "Perfect skill alignment."
    if score > 70: return "Strong potential, some skill gaps."
    return "Partial match, requires upskilling."

@app.post("/matches")
async def get_matches(payload: MatchRequest):
    results = []
    for job in payload.jobs:
        match_data = calculate_score(payload.candidate, job)
        results.append(match_data)
    
    results.sort(key=lambda x: x['match_score'], reverse=True)
    return {"matches": results}