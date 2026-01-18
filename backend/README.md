# Application Lifecycle Management System - Backend

A complete FastAPI application for managing job applications from submission through final decision with full audit trails and analytics.

## Features

✅ **Application Management**
- Submit job applications with duplicate prevention
- Track application status through complete lifecycle
- Full audit trail of all status changes with timestamps

✅ **Status Flow Management**
- Applied → Screening → Interview Scheduled → Interview Completed → Offered/Rejected
- Enforced valid status transitions
- Optional notes for each status change

✅ **Audit Trail & Compliance**
- Complete history of all status changes
- Track who made each change (changed_by field)
- Timestamps for every action
- Immutable audit records

✅ **Analytics & Reporting**
- Overall application statistics
- Job-specific application metrics
- Candidate-specific application history
- Average time to offer calculation
- Offer acceptance rates

✅ **RESTful API**
- 15+ endpoints for complete functionality
- Comprehensive error handling
- Type validation with Pydantic
- Automatic API documentation (Swagger UI)

## Tech Stack

- **Framework**: FastAPI 0.100+
- **Server**: Uvicorn
- **Database**: SQLAlchemy ORM with SQLite
- **Validation**: Pydantic v2
- **Python**: 3.9+

## Installation

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Running the Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Accessing the API

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Database

### Location
- **SQLite Database**: `./applications.db` (auto-created on first run)

### Reset Database
```bash
rm applications.db
# Restart the server to recreate the schema
```

### Database Schema

The system creates 4 tables automatically:

```
┌─────────────────────────────────────────────┐
│         Candidate Table                     │
├─────────────────────────────────────────────┤
│ id (PK)       │ String                      │
│ name          │ String                      │
│ email         │ String (Unique)             │
│ resume_url    │ String (Optional)           │
│ created_at    │ DateTime                    │
│ updated_at    │ DateTime                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Job Table                           │
├─────────────────────────────────────────────┤
│ id (PK)       │ String                      │
│ title         │ String                      │
│ company       │ String                      │
│ status        │ Enum(OPEN, CLOSED)          │
│ description   │ Text (Optional)             │
│ created_at    │ DateTime                    │
│ updated_at    │ DateTime                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Application Table                   │
├─────────────────────────────────────────────┤
│ id (PK)            │ String                  │
│ job_id (FK)        │ String                  │
│ candidate_id (FK)  │ String                  │
│ status             │ Enum(6 values)          │
│ applied_at         │ DateTime                │
│ updated_at         │ DateTime                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         StatusHistory Table (Audit Trail)   │
├─────────────────────────────────────────────┤
│ id (PK)            │ String                  │
│ application_id (FK)│ String                  │
│ old_status         │ Enum (Nullable)         │
│ new_status         │ Enum                    │
│ changed_at         │ DateTime                │
│ notes              │ Text (Optional)         │
│ changed_by         │ String (Optional)       │
└─────────────────────────────────────────────┘
```

## API Endpoints Overview

### Candidate Endpoints
- `POST /candidates` - Create new candidate
- `GET /candidates/{candidate_id}` - Get candidate details
- `GET /candidates/{candidate_id}/applications` - Get all applications (with optional status filter)
- `GET /candidates/{candidate_id}/applications/stats` - Get statistics

### Job Endpoints
- `POST /jobs` - Create new job posting
- `GET /jobs/{job_id}` - Get job details
- `GET /jobs/{job_id}/applications` - Get all applications (with optional status filter)
- `GET /jobs/{job_id}/applications/stats` - Get statistics

### Application Endpoints
- `POST /applications` - Submit new application
- `GET /applications/{application_id}` - Get details with full history
- `PATCH /applications/{application_id}/status` - Update status with audit trail

### Analytics Endpoints
- `GET /applications/stats/dashboard` - Overall dashboard statistics
- `GET /health` - Service health check

## Usage Examples

### 1. Create a Candidate

```bash
curl -X POST http://localhost:8000/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cand-001",
    "name": "John Doe",
    "email": "john@example.com",
    "resume_url": "https://example.com/resume.pdf"
  }'
```

### 2. Create a Job

```bash
curl -X POST http://localhost:8000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "id": "job-001",
    "title": "Senior Developer",
    "company": "TechCorp",
    "description": "We are looking for...",
    "status": "open"
  }'
```

### 3. Submit Application

```bash
curl -X POST http://localhost:8000/applications \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job-001",
    "candidate_id": "cand-001"
  }'
```

### 4. Update Application Status

```bash
curl -X PATCH http://localhost:8000/applications/app-789/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "interview_scheduled",
    "notes": "Interview scheduled for Jan 25 at 2 PM",
    "changed_by": "recruiter-001"
  }'
```

### 5. Get Application with Full History

```bash
curl http://localhost:8000/applications/app-789
```

### 6. Get Candidate Applications

```bash
curl http://localhost:8000/candidates/cand-001/applications
curl http://localhost:8000/candidates/cand-001/applications?status=offered
```

### 7. Get Job Applications

```bash
curl http://localhost:8000/jobs/job-001/applications
curl http://localhost:8000/jobs/job-001/applications?status=interview_scheduled
```

### 8. Get Statistics

```bash
curl http://localhost:8000/applications/stats/dashboard
curl http://localhost:8000/candidates/cand-001/applications/stats
curl http://localhost:8000/jobs/job-001/applications/stats
```

## Testing

Run the included test script to test all endpoints:

```bash
python test_api.py
```

This script will:
1. Create a test candidate
2. Create a test job
3. Submit an application
4. Progress the application through the entire status flow
5. Test all statistics endpoints

## Status Flow Diagram

```
APPLIED
  ├─ → REJECTED (END)
  └─ → SCREENING
       ├─ → REJECTED (END)
       └─ → INTERVIEW_SCHEDULED
            ├─ → REJECTED (END)
            └─ → INTERVIEW_COMPLETED
                 ├─ → OFFERED
                 │    └─ → REJECTED (END)
                 └─ → REJECTED (END)
```

## Error Handling

The API returns appropriate HTTP status codes:

- **200 OK** - Successful GET/PATCH request
- **201 Created** - Successful POST request
- **400 Bad Request** - Invalid data or invalid status transition
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

Example error response:
```json
{
  "detail": "Invalid transition from applied to offered"
}
```

## Project Structure

```
backend/
├── main.py                    # FastAPI application and endpoints
├── models.py                  # SQLAlchemy database models
├── schemas.py                 # Pydantic request/response schemas
├── requirements.txt           # Python dependencies
├── test_api.py               # API test script
├── API_DOCUMENTATION.md      # Detailed API documentation
├── README.md                 # This file
└── applications.db           # SQLite database (auto-created)
```

## Key Design Decisions

### 1. **SQLite Database**
- Simple deployment with no external dependencies
- Easy to reset for testing
- Perfect for MVP and single-server deployments
- Can be easily migrated to PostgreSQL

### 2. **UUID for IDs**
- Auto-generated UUIDs for applications and status history
- Client-provided IDs for candidates and jobs (for integration)

### 3. **Audit Trail**
- Every status change is immutable recorded
- Includes timestamp, old status, new status, notes, and who changed it
- Enables compliance and debugging

### 4. **Status Validation**
- Enforced valid state transitions
- Prevents invalid workflows
- Clear error messages for invalid transitions

### 5. **Statistics Calculation**
- Real-time calculation from database
- No denormalized data needed
- Accurate and always up-to-date

## Performance Considerations

For production use with large datasets:

1. **Database Indexing**: Status and dates are indexed for faster queries
2. **Foreign Keys**: Proper relationships prevent orphaned records
3. **Pagination**: Can be added to list endpoints if needed
4. **Caching**: Consider Redis for frequently accessed statistics
5. **Database**: PostgreSQL recommended for production

## Future Enhancements

- [ ] Bulk import/export functionality
- [ ] Email notifications for status changes
- [ ] Interview scheduling integration
- [ ] Document storage integration (S3)
- [ ] Analytics dashboard frontend
- [ ] Role-based access control (RBAC)
- [ ] Webhook notifications
- [ ] GraphQL support
- [ ] Batch status updates
- [ ] Advanced filtering and search

## Troubleshooting

### Issue: "Cannot connect to database"
**Solution**: Delete `applications.db` and restart the server

### Issue: "404 Not Found" on application
**Solution**: Check that candidate and job exist before creating application

### Issue: "Invalid transition" error
**Solution**: Check the valid status flow diagram above

### Issue: "Already applied to this job"
**Solution**: This is expected - candidates can only apply once per job

## Support

For detailed API documentation with examples, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## License

MIT License - Feel free to use and modify as needed
