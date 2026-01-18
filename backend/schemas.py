from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum


class StatusEnum(str, Enum):
    """Application status"""
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    OFFERED = "offered"
    REJECTED = "rejected"


class JobStatusEnum(str, Enum):
    """Job status"""
    OPEN = "open"
    CLOSED = "closed"


# --- Candidate Schemas ---
class CandidateCreate(BaseModel):
    id: str
    name: str
    email: str
    resume_url: Optional[str] = None


class CandidateResponse(BaseModel):
    id: str
    name: str
    email: str
    resume_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Job Schemas ---
class JobCreate(BaseModel):
    id: str
    title: str
    company: str
    description: Optional[str] = None
    status: JobStatusEnum = JobStatusEnum.OPEN


class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    status: JobStatusEnum
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# --- Status History Schemas ---
class StatusHistoryResponse(BaseModel):
    id: str
    application_id: str
    old_status: Optional[StatusEnum]
    new_status: StatusEnum
    changed_at: datetime
    notes: Optional[str]
    changed_by: Optional[str]
    
    class Config:
        from_attributes = True


# --- Application Schemas ---
class ApplicationSubmit(BaseModel):
    job_id: str
    candidate_id: str


class ApplicationStatusUpdate(BaseModel):
    status: StatusEnum
    notes: Optional[str] = None
    changed_by: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    status: StatusEnum
    applied_at: datetime
    updated_at: datetime
    candidate: CandidateResponse
    job: JobResponse
    
    class Config:
        from_attributes = True


class ApplicationWithHistory(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    status: StatusEnum
    applied_at: datetime
    updated_at: datetime
    candidate: CandidateResponse
    job: JobResponse
    status_history: List[StatusHistoryResponse]
    
    class Config:
        from_attributes = True


# --- Statistics Schemas ---
class ApplicationStats(BaseModel):
    total_applications: int
    by_status: dict  # {status: count}
    by_job: dict  # {job_id: count}
    total_candidates: int
    total_jobs: int
    average_time_to_offer: Optional[float] = None  # Days
    offer_acceptance_rate: Optional[float] = None  # Percentage


class JobApplicationStats(BaseModel):
    job_id: str
    job_title: str
    total_applications: int
    by_status: dict  # {status: count}


class CandidateApplicationStats(BaseModel):
    candidate_id: str
    candidate_name: str
    total_applications: int
    by_status: dict  # {status: count}
    offers_received: int
    rejections: int
