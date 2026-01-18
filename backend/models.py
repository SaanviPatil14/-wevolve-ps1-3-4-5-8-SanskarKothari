from sqlalchemy import Column, String, DateTime, Integer, Text, Enum, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

Base = declarative_base()

# Database Setup
DATABASE_URL = "sqlite:///./applications.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class StatusEnum(str, enum.Enum):
    """Application status flow"""
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    OFFERED = "offered"
    REJECTED = "rejected"


class JobStatusEnum(str, enum.Enum):
    """Job status"""
    OPEN = "open"
    CLOSED = "closed"


class Candidate(Base):
    """Candidate model"""
    __tablename__ = "candidates"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    resume_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = relationship("Application", back_populates="candidate")


class Job(Base):
    """Job model"""
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    status = Column(Enum(JobStatusEnum), default=JobStatusEnum.OPEN)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = relationship("Application", back_populates="job")


class Application(Base):
    """Application model"""
    __tablename__ = "applications"
    
    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), index=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), index=True)
    status = Column(Enum(StatusEnum), default=StatusEnum.APPLIED, index=True)
    applied_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    candidate = relationship("Candidate", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    status_history = relationship("StatusHistory", back_populates="application", cascade="all, delete-orphan")


class StatusHistory(Base):
    """Status history audit trail"""
    __tablename__ = "status_history"
    
    id = Column(String, primary_key=True, index=True)
    application_id = Column(String, ForeignKey("applications.id"), index=True)
    old_status = Column(Enum(StatusEnum), nullable=True)
    new_status = Column(Enum(StatusEnum))
    changed_at = Column(DateTime, default=datetime.utcnow, index=True)
    notes = Column(Text, nullable=True)
    changed_by = Column(String, nullable=True)  # User ID who made the change
    
    # Relationships
    application = relationship("Application", back_populates="status_history")


# Create all tables
Base.metadata.create_all(bind=engine)
