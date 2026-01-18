# Application Lifecycle Management API

## Overview
Complete FastAPI application for managing job applications from submission through final decision with full audit trails.

## Database Schema

### Candidate
```
- id: String (Primary Key)
- name: String
- email: String (Unique)
- resume_url: String (Optional)
- created_at: DateTime
- updated_at: DateTime
```

### Job
```
- id: String (Primary Key)
- title: String
- company: String
- status: Enum(OPEN, CLOSED)
- description: String (Optional)
- created_at: DateTime
- updated_at: DateTime
```

### Application
```
- id: String (Primary Key)
- job_id: String (Foreign Key)
- candidate_id: String (Foreign Key)
- status: Enum(APPLIED, SCREENING, INTERVIEW_SCHEDULED, INTERVIEW_COMPLETED, OFFERED, REJECTED)
- applied_at: DateTime
- updated_at: DateTime
```

### StatusHistory (Audit Trail)
```
- id: String (Primary Key)
- application_id: String (Foreign Key)
- old_status: Enum (Nullable)
- new_status: Enum
- changed_at: DateTime
- notes: String (Optional)
- changed_by: String (Optional - User ID)
```

## API Endpoints

### Candidate Management

#### Create Candidate
```
POST /candidates
Content-Type: application/json

{
  "id": "candidate-123",
  "name": "John Doe",
  "email": "john@example.com",
  "resume_url": "https://example.com/resume.pdf"
}

Response: 201 Created
{
  "id": "candidate-123",
  "name": "John Doe",
  "email": "john@example.com",
  "resume_url": "https://example.com/resume.pdf",
  "created_at": "2024-01-18T10:00:00",
  "updated_at": "2024-01-18T10:00:00"
}
```

#### Get Candidate Details
```
GET /candidates/{candidate_id}

Response: 200 OK
{
  "id": "candidate-123",
  "name": "John Doe",
  "email": "john@example.com",
  "resume_url": "https://example.com/resume.pdf",
  "created_at": "2024-01-18T10:00:00",
  "updated_at": "2024-01-18T10:00:00"
}
```

### Job Management

#### Create Job
```
POST /jobs
Content-Type: application/json

{
  "id": "job-456",
  "title": "Senior Developer",
  "company": "Tech Corp",
  "description": "Looking for an experienced developer...",
  "status": "open"
}

Response: 201 Created
{
  "id": "job-456",
  "title": "Senior Developer",
  "company": "Tech Corp",
  "status": "open",
  "description": "Looking for an experienced developer...",
  "created_at": "2024-01-18T10:00:00",
  "updated_at": "2024-01-18T10:00:00"
}
```

#### Get Job Details
```
GET /jobs/{job_id}

Response: 200 OK
{
  "id": "job-456",
  "title": "Senior Developer",
  "company": "Tech Corp",
  "status": "open",
  "description": "Looking for an experienced developer...",
  "created_at": "2024-01-18T10:00:00",
  "updated_at": "2024-01-18T10:00:00"
}
```

### Application Management

#### Submit Application
```
POST /applications
Content-Type: application/json

{
  "job_id": "job-456",
  "candidate_id": "candidate-123"
}

Response: 201 Created
{
  "id": "app-789",
  "job_id": "job-456",
  "candidate_id": "candidate-123",
  "status": "applied",
  "applied_at": "2024-01-18T10:05:00",
  "updated_at": "2024-01-18T10:05:00",
  "candidate": { ... },
  "job": { ... }
}

Error Cases:
- 404: Candidate or Job not found
- 400: Already applied to this job
```

#### Get Application Details with History
```
GET /applications/{application_id}

Response: 200 OK
{
  "id": "app-789",
  "job_id": "job-456",
  "candidate_id": "candidate-123",
  "status": "screening",
  "applied_at": "2024-01-18T10:05:00",
  "updated_at": "2024-01-18T11:00:00",
  "candidate": { ... },
  "job": { ... },
  "status_history": [
    {
      "id": "hist-1",
      "application_id": "app-789",
      "old_status": null,
      "new_status": "applied",
      "changed_at": "2024-01-18T10:05:00",
      "notes": "Application submitted",
      "changed_by": null
    },
    {
      "id": "hist-2",
      "application_id": "app-789",
      "old_status": "applied",
      "new_status": "screening",
      "changed_at": "2024-01-18T11:00:00",
      "notes": "Passed initial screening",
      "changed_by": "recruiter-001"
    }
  ]
}
```

#### Update Application Status
```
PATCH /applications/{application_id}/status
Content-Type: application/json

{
  "status": "interview_scheduled",
  "notes": "Interview scheduled for Jan 25 at 2 PM",
  "changed_by": "recruiter-001"
}

Response: 200 OK
{
  "id": "app-789",
  "job_id": "job-456",
  "candidate_id": "candidate-123",
  "status": "interview_scheduled",
  "applied_at": "2024-01-18T10:05:00",
  "updated_at": "2024-01-18T11:30:00",
  "candidate": { ... },
  "job": { ... },
  "status_history": [ ... ]
}

Valid Status Transitions:
- applied → [screening, rejected]
- screening → [interview_scheduled, rejected]
- interview_scheduled → [interview_completed, rejected]
- interview_completed → [offered, rejected]
- offered → [rejected]
- rejected → []

Error Cases:
- 404: Application not found
- 400: Invalid status transition
```

### Candidate Applications

#### Get Candidate's All Applications
```
GET /candidates/{candidate_id}/applications
GET /candidates/{candidate_id}/applications?status=offered

Response: 200 OK
[
  {
    "id": "app-789",
    "job_id": "job-456",
    "candidate_id": "candidate-123",
    "status": "offered",
    "applied_at": "2024-01-18T10:05:00",
    "updated_at": "2024-01-18T15:00:00",
    "candidate": { ... },
    "job": { ... }
  },
  ...
]

Query Parameters:
- status: Optional, filter by status (applied, screening, interview_scheduled, interview_completed, offered, rejected)
```

#### Get Candidate Application Statistics
```
GET /candidates/{candidate_id}/applications/stats

Response: 200 OK
{
  "candidate_id": "candidate-123",
  "candidate_name": "John Doe",
  "total_applications": 5,
  "by_status": {
    "applied": 1,
    "screening": 0,
    "interview_scheduled": 1,
    "interview_completed": 0,
    "offered": 1,
    "rejected": 2
  },
  "offers_received": 1,
  "rejections": 2
}
```

### Job Applications

#### Get Job's All Applications
```
GET /jobs/{job_id}/applications
GET /jobs/{job_id}/applications?status=interview_scheduled

Response: 200 OK
[
  {
    "id": "app-789",
    "job_id": "job-456",
    "candidate_id": "candidate-123",
    "status": "interview_scheduled",
    "applied_at": "2024-01-18T10:05:00",
    "updated_at": "2024-01-18T11:30:00",
    "candidate": { ... },
    "job": { ... }
  },
  ...
]

Query Parameters:
- status: Optional, filter by status
```

#### Get Job Application Statistics
```
GET /jobs/{job_id}/applications/stats

Response: 200 OK
{
  "job_id": "job-456",
  "job_title": "Senior Developer",
  "total_applications": 25,
  "by_status": {
    "applied": 10,
    "screening": 8,
    "interview_scheduled": 4,
    "interview_completed": 2,
    "offered": 1,
    "rejected": 0
  }
}
```

### Dashboard Statistics

#### Get Overall Application Statistics
```
GET /applications/stats/dashboard

Response: 200 OK
{
  "total_applications": 150,
  "by_status": {
    "applied": 50,
    "screening": 40,
    "interview_scheduled": 30,
    "interview_completed": 20,
    "offered": 8,
    "rejected": 2
  },
  "by_job": {
    "job-456:Senior Developer": 25,
    "job-789:Junior Developer": 30,
    ...
  },
  "total_candidates": 120,
  "total_jobs": 15,
  "average_time_to_offer": 14.5,
  "offer_acceptance_rate": 5.33
}
```

### Health Check

#### Service Health
```
GET /health

Response: 200 OK
{
  "status": "healthy",
  "service": "Application Lifecycle Management"
}
```

## Status Flow Diagram

```
┌─────────┐
│ APPLIED │
└────┬────┘
     │
     ├──→ [REJECTED] ──→ (END)
     │
     ▼
┌───────────┐
│ SCREENING │
└────┬──────┘
     │
     ├──→ [REJECTED] ──→ (END)
     │
     ▼
┌──────────────────────┐
│ INTERVIEW_SCHEDULED  │
└────┬─────────────────┘
     │
     ├──→ [REJECTED] ──→ (END)
     │
     ▼
┌──────────────────────┐
│ INTERVIEW_COMPLETED  │
└────┬─────────────────┘
     │
     ├──→ [OFFERED] ──→ [REJECTED] ──→ (END)
     │
     ├──→ [REJECTED] ──→ (END)
```

## Error Responses

### 404 Not Found
```json
{
  "detail": "Candidate not found"
}
```

### 400 Bad Request
```json
{
  "detail": "Already applied to this job"
}
```

### 400 Bad Request (Invalid Status Transition)
```json
{
  "detail": "Invalid transition from applied to offered"
}
```

## Running the Server

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Access the API documentation at: `http://localhost:8000/docs`

## Database Location

The SQLite database is created at: `./applications.db`

To reset the database, delete the `applications.db` file and restart the server.
