from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import json
import re
import uuid

from models import (
    Base, engine, SessionLocal, 
    Candidate, Job, Application, StatusHistory,
    StatusEnum, JobStatusEnum
)
from schemas import (
    CandidateCreate, CandidateResponse,
    JobCreate, JobResponse,
    ApplicationSubmit, ApplicationStatusUpdate, ApplicationResponse, ApplicationWithHistory,
    StatusHistoryResponse,
    ApplicationStats, JobApplicationStats, CandidateApplicationStats
)
from matching_engine import (
    JobMatchingEngine, MatchingRequest, MatchingResponse,
    CandidateMatchProfile, JobPostingForMatch
)

app = FastAPI(title="Job Application Lifecycle Management", version="1.0.0")

# Create database tables
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Enhanced Taxonomy ---
TAXONOMY = {
    "python": {"category": "Backend", "difficulty": 1},
    "django": {"category": "Backend", "difficulty": 2},
    "fastapi": {"category": "Backend", "difficulty": 2},
    "react": {"category": "Frontend", "difficulty": 2},
    "react.js": {"category": "Frontend", "difficulty": 2},
    "javascript": {"category": "Frontend", "difficulty": 1},
    "typescript": {"category": "Frontend", "difficulty": 2},
    "aws": {"category": "DevOps", "difficulty": 3},
    "docker": {"category": "DevOps", "difficulty": 2},
    "kubernetes": {"category": "DevOps", "difficulty": 3},
    "sql": {"category": "Database", "difficulty": 1},
    "postgresql": {"category": "Database", "difficulty": 2},
    "mongodb": {"category": "Database", "difficulty": 2},
    "git": {"category": "Tools", "difficulty": 1},
    "ci/cd": {"category": "DevOps", "difficulty": 2},
    "system design": {"category": "Architecture", "difficulty": 3},
    "java": {"category": "Backend", "difficulty": 2},
    "spring boot": {"category": "Backend", "difficulty": 3},
    "communication": {"category": "Soft Skills", "difficulty": 1},
    "leadership": {"category": "Soft Skills", "difficulty": 2},
}

# --- Models ---
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
    salary_range: List[float]
    company: str

class MatchRequest(BaseModel):
    candidate: CandidateMatchProfile
    jobs: List[JobPosting]

# --- Helper Functions ---

def calculate_salary_growth(current_exp: int):
    base = 800000 
    return [
        {"year": "Current", "salary": base, "role": "Junior"},
        {"year": "Year 1", "salary": int(base * 1.4), "role": "Mid-Level"},
        {"year": "Year 2", "salary": int(base * 1.8), "role": "Senior"},
        {"year": "Year 3", "salary": int(base * 2.5), "role": "Lead"}
    ]

# ▼▼▼ FIXED: GRAPH LOGIC (Forces 5 Axes) ▼▼▼
def generate_radar_data(current_skills, required_skills):
    # Fixed Categories ensures the graph is always a pentagon/hexagon
    categories = ["Frontend", "Backend", "DevOps", "Database", "Tools"]
    data = []
    
    cand_clean = [s.lower().strip() for s in current_skills]
    req_clean = [s.lower().strip() for s in required_skills]

    for cat in categories:
        # 1. Find all required skills for this category
        cat_reqs = [s for s in req_clean if TAXONOMY.get(s, {}).get("category") == cat]
        
        # 2. Count how many of those the candidate has
        cat_matches = [s for s in cat_reqs if any(c in s or s in c for c in cand_clean)]
        
        # 3. Calculate Scores
        # If job doesn't need "DevOps", we still return 0 for graph shape stability
        target_val = 100 if len(cat_reqs) > 0 else 20 
        
        cand_val = 0
        if len(cat_reqs) > 0:
            cand_val = (len(cat_matches) / len(cat_reqs)) * 100
        else:
            # If candidate has skills in this category even if not required, give small points
            has_general_skill = any(TAXONOMY.get(s, {}).get("category") == cat for s in cand_clean)
            if has_general_skill: cand_val = 50

        data.append({
            "subject": cat,
            "A": round(cand_val),
            "B": target_val,
            "fullMark": 100
        })
            
    return data

@app.post("/chat")
async def chat_with_sam(payload: Dict[str, Any]):
    user_msg = payload.get("message", "").lower()
    job = payload.get("job", {})
    candidate = payload.get("candidate", {})
    match_data = payload.get("match_data", {})
    
    if "salary" in user_msg:
        res = f"Sam here! This role offers {job.get('salary_range')}. Based on your expectation of {candidate.get('expected_salary')}, it's a financial match!"
    elif "skill" in user_msg or "gap" in user_msg:
        missing = match_data.get("missing_skills", [])
        if not missing:
            res = "You have all the required skills! 100% match on technicals."
        else:
            res = f"You match {match_data.get('match_score')}% of requirements. To close the gap, you need to learn: {', '.join(missing[:2])}."
    elif "location" in user_msg:
        res = f"The job is in {job.get('location')}. Your preferences are {candidate.get('preferred_locations')}. "
    else:
        res = f"I'm Sam, your Career AI. I've analyzed your fit for {job.get('title')} at {job.get('company')}. Ask me about salary, skills, or location!"

    return {"text": res}

@app.post("/analyze")
async def analyze_gap(payload: GapAnalysisRequest):
    candidate = payload.candidate
    target = payload.target_role

    print(f"Analyzing Job: {target.title}")
    
    current_raw = [s.lower().strip() for s in candidate.current_skills]
    required_raw = [s.lower().strip() for s in target.required_skills]
    
    matching = []
    missing = []
    
    for req in required_raw:
        found = False
        for cur in current_raw:
            if req == cur or req in cur or cur in req:
                found = True
                break
        
        if found:
            matching.append(req.title())
        else:
            missing.append(req.title())
            
    total_required = len(required_raw)
    
    if total_required > 0:
        gap_pct = (len(missing) / total_required) * 100
    else:
        gap_pct = 0

    if gap_pct == 0:
        ai_msg = "Perfect Match! You have all the skills."
    elif gap_pct < 40:
        ai_msg = f"Great fit! You only need to learn {len(missing)} more skills."
    else:
        ai_msg = f"Significant growth opportunity. Master these {len(missing)} skills to qualify."
        
    total_time = 0.0
    roadmap = []
    
    missing_skill_objects = []
    for skill in missing:
        key = skill.lower()
        found_key = next((k for k in TAXONOMY if k in key), None)
        info = TAXONOMY.get(found_key, {"category": "Technical", "difficulty": 1.5})
        
        time_needed = info.get("difficulty", 1) * 1.0 
        total_time += time_needed
        
        missing_skill_objects.append({
            "name": skill,
            "category": info.get("category", "Technical"),
            "time": time_needed,
            "difficulty": info.get("difficulty", 1)
        })

    missing_skill_objects.sort(key=lambda x: x['difficulty'])

    phase_counter = 1
    chunk_size = 2
    for i in range(0, len(missing_skill_objects), chunk_size):
        chunk = missing_skill_objects[i:i+chunk_size]
        phase_names = [s['name'] for s in chunk]
        phase_time = sum(s['time'] for s in chunk)
        phase_focus = chunk[0]['category']
        
        roadmap.append({
            "phase": phase_counter,
            "duration_months": round(phase_time, 1),
            "focus": f"Mastering {phase_focus}",
            "skills_to_learn": phase_names,
            "priority": "High" if phase_counter == 1 else "Medium",
            "reasoning": f"Critical to perform {target.title} tasks."
        })
        phase_counter += 1

    return {
        "analysis": {
            "matching_skills": matching,
            "missing_skills": missing,
            "skill_gap_percentage": round(gap_pct),
            "estimated_learning_time_months": round(total_time, 1),
            "ai_summary": ai_msg
        },
        "learning_roadmap": roadmap,
        "radar_data": generate_radar_data(candidate.current_skills, target.required_skills),
        "salary_growth": calculate_salary_growth(candidate.experience_years)
    }

# --- Standard Matching Logic ---
def parse_experience(exp_str: str) -> tuple:
    nums = re.findall(r'\d+', exp_str)
    if not nums: return (0, 0)
    if len(nums) == 1: return (int(nums[0]), int(nums[0]))
    return (int(nums[0]), int(nums[1]))

def calculate_score(candidate: CandidateMatchProfile, job: JobPosting):
    W_SKILL = 0.50
    W_LOC = 0.25
    W_SALARY = 0.15
    W_EXP = 0.10

    job_skills = set(s.lower() for s in job.required_skills)
    cand_skills = set(s.lower() for s in candidate.skills)
    
    if not job_skills:
        skill_score = 100
    else:
        matches = 0
        for req in job_skills:
            for cur in cand_skills:
                if req == cur or req in cur or cur in req:
                    matches += 1
                    break
        skill_score = (matches / len(job_skills)) * 100

    if skill_score < 10:
        return {
            "job_id": job.job_id,
            "match_score": 0,
            "breakdown": { "skill_match": 0, "location_match": 0, "salary_match": 0, "experience_match": 0 },
            "missing_skills": job.required_skills,
            "recommendation_reason": "Not a fit: Critical skills missing."
        }

    loc_score = 100 if any(l.lower() in job.location.lower() for l in candidate.preferred_locations) else 20
    
    salary_score = 0
    job_max = job.salary_range[1] if len(job.salary_range) > 1 else job.salary_range[0]
    if candidate.expected_salary <= job_max: salary_score = 100
    elif candidate.expected_salary - job_max < 200000: salary_score = 50
    
    exp_min, exp_max = parse_experience(job.experience_required)
    exp_score = 100 if exp_min <= candidate.experience_years <= exp_max + 1 else 40
    
    final_score = (skill_score * W_SKILL) + (loc_score * W_LOC) + (salary_score * W_SALARY) + (exp_score * W_EXP)

    missing = []
    for req in job_skills:
        found = False
        for cur in cand_skills:
            if req == cur or req in cur or cur in req: found = True
        if not found: missing.append(req.title())

    return {
        "job_id": job.job_id,
        "match_score": round(final_score, 1),
        "breakdown": {
            "skill_match": round(skill_score),
            "location_match": round(loc_score),
            "salary_match": round(salary_score),
            "experience_match": round(exp_score)
        },
        "missing_skills": missing,
        "recommendation_reason": "Strong match" if final_score > 70 else "Partial match"
    }

@app.post("/matches")
async def get_matches(payload: MatchRequest):
    results = []
    for job in payload.jobs:
        match_data = calculate_score(payload.candidate, job)
        results.append(match_data)
    results.sort(key=lambda x: x['match_score'], reverse=True)
    return {"matches": results}


# ========================================
# APPLICATION LIFECYCLE MANAGEMENT ENDPOINTS
# ========================================

# --- CANDIDATE ENDPOINTS ---

@app.post("/candidates", response_model=CandidateResponse)
async def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    """Create a new candidate"""
    # Check if candidate already exists
    existing = db.query(Candidate).filter(Candidate.id == candidate.id).first()
    if existing:
        return existing
    
    db_candidate = Candidate(**candidate.dict())
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate


@app.get("/candidates/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    """Get candidate details"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


# --- JOB ENDPOINTS ---

@app.post("/jobs", response_model=JobResponse)
async def create_job(job: JobCreate, db: Session = Depends(get_db)):
    """Create a new job posting"""
    existing = db.query(Job).filter(Job.id == job.id).first()
    if existing:
        return existing
    
    db_job = Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: Session = Depends(get_db)):
    """Get job details"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# --- APPLICATION ENDPOINTS ---

@app.post("/applications", response_model=ApplicationResponse, status_code=201)
async def submit_application(app_submit: ApplicationSubmit, db: Session = Depends(get_db)):
    """Submit a new application"""
    
    # Verify candidate and job exist
    candidate = db.query(Candidate).filter(Candidate.id == app_submit.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    job = db.query(Job).filter(Job.id == app_submit.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already applied
    existing_app = db.query(Application).filter(
        Application.job_id == app_submit.job_id,
        Application.candidate_id == app_submit.candidate_id
    ).first()
    
    if existing_app:
        raise HTTPException(status_code=400, detail="Already applied to this job")
    
    # Create application
    application_id = str(uuid.uuid4())
    db_application = Application(
        id=application_id,
        job_id=app_submit.job_id,
        candidate_id=app_submit.candidate_id,
        status=StatusEnum.APPLIED
    )
    
    # Create initial status history
    history_id = str(uuid.uuid4())
    db_history = StatusHistory(
        id=history_id,
        application_id=application_id,
        old_status=None,
        new_status=StatusEnum.APPLIED,
        notes="Application submitted"
    )
    
    db.add(db_application)
    db.add(db_history)
    db.commit()
    db.refresh(db_application)
    
    return db_application


@app.get("/applications/{application_id}", response_model=ApplicationWithHistory)
async def get_application_details(application_id: str, db: Session = Depends(get_db)):
    """Get application details with full status history"""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


@app.patch("/applications/{application_id}/status", response_model=ApplicationWithHistory)
async def update_application_status(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update application status with audit trail"""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Validate status transition
    valid_transitions = {
        StatusEnum.APPLIED: [StatusEnum.SCREENING, StatusEnum.REJECTED],
        StatusEnum.SCREENING: [StatusEnum.INTERVIEW_SCHEDULED, StatusEnum.REJECTED],
        StatusEnum.INTERVIEW_SCHEDULED: [StatusEnum.INTERVIEW_COMPLETED, StatusEnum.REJECTED],
        StatusEnum.INTERVIEW_COMPLETED: [StatusEnum.OFFERED, StatusEnum.REJECTED],
        StatusEnum.OFFERED: [StatusEnum.REJECTED],
        StatusEnum.REJECTED: []
    }
    
    if status_update.status not in valid_transitions.get(application.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {application.status} to {status_update.status}"
        )
    
    old_status = application.status
    application.status = status_update.status
    application.updated_at = datetime.utcnow()
    
    # Create status history entry
    history_id = str(uuid.uuid4())
    db_history = StatusHistory(
        id=history_id,
        application_id=application_id,
        old_status=old_status,
        new_status=status_update.status,
        notes=status_update.notes,
        changed_by=status_update.changed_by
    )
    
    db.add(db_history)
    db.commit()
    db.refresh(application)
    
    return application


@app.get("/candidates/{candidate_id}/applications", response_model=List[ApplicationResponse])
async def get_candidate_applications(
    candidate_id: str,
    status: Optional[StatusEnum] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all applications for a candidate, optionally filtered by status"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    query = db.query(Application).filter(Application.candidate_id == candidate_id)
    
    if status:
        query = query.filter(Application.status == status)
    
    applications = query.order_by(Application.applied_at.desc()).all()
    return applications


@app.get("/jobs/{job_id}/applications", response_model=List[ApplicationResponse])
async def get_job_applications(
    job_id: str,
    status: Optional[StatusEnum] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all applications for a job, optionally filtered by status"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    query = db.query(Application).filter(Application.job_id == job_id)
    
    if status:
        query = query.filter(Application.status == status)
    
    applications = query.order_by(Application.applied_at.desc()).all()
    return applications


@app.get("/applications/stats/dashboard", response_model=ApplicationStats)
async def get_application_stats(db: Session = Depends(get_db)):
    """Get overall application statistics"""
    total_applications = db.query(func.count(Application.id)).scalar()
    total_candidates = db.query(func.count(Candidate.id)).scalar()
    total_jobs = db.query(func.count(Job.id)).scalar()
    
    # Applications by status
    by_status = {}
    for status in StatusEnum:
        count = db.query(func.count(Application.id)).filter(
            Application.status == status
        ).scalar()
        by_status[status.value] = count
    
    # Applications by job (top jobs)
    by_job_query = db.query(
        Job.id,
        Job.title,
        func.count(Application.id).label("count")
    ).join(Application).group_by(Job.id, Job.title).order_by(
        func.count(Application.id).desc()
    ).limit(10).all()
    
    by_job = {f"{job_id}:{title}": count for job_id, title, count in by_job_query}
    
    # Calculate average time to offer (in days)
    offered_apps = db.query(Application).filter(
        Application.status == StatusEnum.OFFERED
    ).all()
    
    avg_time_to_offer = None
    if offered_apps:
        times = []
        for app in offered_apps:
            if app.status_history:
                start = app.applied_at
                end = app.updated_at
                days = (end - start).days
                times.append(days)
        if times:
            avg_time_to_offer = sum(times) / len(times)
    
    # Calculate offer acceptance rate
    total_offers = db.query(func.count(Application.id)).filter(
        Application.status == StatusEnum.OFFERED
    ).scalar()
    offer_rate = (total_offers / total_applications * 100) if total_applications > 0 else 0
    
    return ApplicationStats(
        total_applications=total_applications or 0,
        by_status=by_status,
        by_job=by_job,
        total_candidates=total_candidates or 0,
        total_jobs=total_jobs or 0,
        average_time_to_offer=avg_time_to_offer,
        offer_acceptance_rate=round(offer_rate, 2)
    )


@app.get("/jobs/{job_id}/applications/stats", response_model=JobApplicationStats)
async def get_job_application_stats(job_id: str, db: Session = Depends(get_db)):
    """Get application statistics for a specific job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    total = db.query(func.count(Application.id)).filter(
        Application.job_id == job_id
    ).scalar()
    
    by_status = {}
    for status in StatusEnum:
        count = db.query(func.count(Application.id)).filter(
            Application.job_id == job_id,
            Application.status == status
        ).scalar()
        by_status[status.value] = count
    
    return JobApplicationStats(
        job_id=job_id,
        job_title=job.title,
        total_applications=total or 0,
        by_status=by_status
    )


@app.get("/candidates/{candidate_id}/applications/stats", response_model=CandidateApplicationStats)
async def get_candidate_application_stats(
    candidate_id: str,
    db: Session = Depends(get_db)
):
    """Get application statistics for a specific candidate"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    total = db.query(func.count(Application.id)).filter(
        Application.candidate_id == candidate_id
    ).scalar()
    
    by_status = {}
    for status in StatusEnum:
        count = db.query(func.count(Application.id)).filter(
            Application.candidate_id == candidate_id,
            Application.status == status
        ).scalar()
        by_status[status.value] = count
    
    offers = db.query(func.count(Application.id)).filter(
        Application.candidate_id == candidate_id,
        Application.status == StatusEnum.OFFERED
    ).scalar()
    
    rejections = db.query(func.count(Application.id)).filter(
        Application.candidate_id == candidate_id,
        Application.status == StatusEnum.REJECTED
    ).scalar()
    
    return CandidateApplicationStats(
        candidate_id=candidate_id,
        candidate_name=candidate.name,
        total_applications=total or 0,
        by_status=by_status,
        offers_received=offers or 0,
        rejections=rejections or 0
    )


# --- HEALTH CHECK ---

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Application Lifecycle Management"}


# ============================================================================
# --- MULTI-FACTOR JOB MATCHING ENGINE ---
# ============================================================================

@app.post("/api/match/candidate-to-jobs", response_model=MatchingResponse)
async def match_candidate_to_jobs(request: MatchingRequest):
    """
    Multi-factor job matching endpoint
    
    Matches a candidate profile against multiple job postings using weighted scoring:
    - Skill Match: 40%
    - Location Match: 20%
    - Salary Match: 15%
    - Experience Match: 15%
    - Role Match: 10%
    
    Args:
        request: MatchingRequest containing candidate profile and job list
    
    Returns:
        MatchingResponse with ranked matches and detailed breakdowns
    
    Example:
        POST /api/match/candidate-to-jobs
        {
          "candidate": {
            "skills": ["Python", "FastAPI", "Docker"],
            "experience_years": 2,
            "preferred_locations": ["Bangalore"],
            "preferred_roles": ["Backend Developer"],
            "expected_salary": 850000,
            "education": {
              "degree": "B.Tech",
              "field": "CS",
              "cgpa": 8.5
            }
          },
          "jobs": [
            {
              "job_id": "J001",
              "title": "Backend Developer",
              "required_skills": ["Python", "FastAPI"],
              "experience_required": "1-3 years",
              "location": "Bangalore",
              "salary_range": [600000, 1200000],
              "company": "TechCorp"
            }
          ]
        }
    """
    try:
        # Validate input
        if not request.candidate.skills:
            raise HTTPException(status_code=400, detail="Candidate must have at least one skill")
        
        if not request.jobs:
            raise HTTPException(status_code=400, detail="Must provide at least one job")
        
        # Initialize matching engine
        engine = JobMatchingEngine()
        
        # Perform matching
        response = engine.match_candidate_to_jobs(request.candidate, request.jobs)
        
        return response
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")


@app.get("/api/match/engine/weights")
async def get_matching_weights():
    """Get the weights used in the matching algorithm"""
    engine = JobMatchingEngine()
    return {
        "weights": engine.WEIGHTS,
        "total": sum(engine.WEIGHTS.values()),
        "description": {
            "skill": "Technical skill alignment (40%)",
            "location": "Location preference match (20%)",
            "salary": "Salary expectation alignment (15%)",
            "experience": "Experience level match (15%)",
            "role": "Job title preference match (10%)"
        }
    }
