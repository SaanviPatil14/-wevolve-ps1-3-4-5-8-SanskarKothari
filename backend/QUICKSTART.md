# Quick Start Guide - Application Lifecycle Management API

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Run the Server
```bash
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Step 3: Access the API
Open your browser and visit:
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## Try the API in 30 Seconds

### Option 1: Using Swagger UI (Recommended for Beginners)

1. Go to http://localhost:8000/docs
2. Click "Try it out" on any endpoint
3. Fill in the request body
4. Click "Execute"

### Option 2: Using cURL (Command Line)

```bash
# 1. Create a candidate
curl -X POST http://localhost:8000/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "resume_url": "https://example.com/resume.pdf"
  }'

# 2. Create a job
curl -X POST http://localhost:8000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "id": "job-456",
    "title": "Senior Developer",
    "company": "TechCorp",
    "description": "Looking for a senior developer",
    "status": "open"
  }'

# 3. Submit an application
curl -X POST http://localhost:8000/applications \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job-456",
    "candidate_id": "user-123"
  }'

# 4. Check the application (use the ID from step 3)
curl http://localhost:8000/applications/[application-id-from-response]

# 5. Update status
curl -X PATCH http://localhost:8000/applications/[app-id]/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "screening",
    "notes": "Passed initial review",
    "changed_by": "recruiter-001"
  }'
```

### Option 3: Using Python Test Script

```bash
python test_api.py
```

This will automatically test all endpoints and show you examples.

## Key Endpoints Explained

### 1. Create Candidate
```
POST /candidates
```
**What it does:** Register a job seeker
**Request:**
```json
{
  "id": "candidate-123",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "resume_url": "https://example.com/resume.pdf"
}
```

### 2. Create Job
```
POST /jobs
```
**What it does:** Post a new job opening
**Request:**
```json
{
  "id": "job-123",
  "title": "Senior Full Stack Developer",
  "company": "TechCorp",
  "description": "We are looking for...",
  "status": "open"
}
```

### 3. Submit Application
```
POST /applications
```
**What it does:** Apply for a job
**Request:**
```json
{
  "job_id": "job-123",
  "candidate_id": "candidate-123"
}
```
**Response includes:** application ID, status (initial = "applied")

### 4. Check Application Status
```
GET /applications/{application_id}
```
**What it does:** Get full application details including complete history
**Response includes:**
- Current status
- Applied date
- Complete status history with timestamps
- Candidate details
- Job details

### 5. Update Application Status
```
PATCH /applications/{application_id}/status
```
**What it does:** Move application to next stage
**Request:**
```json
{
  "status": "interview_scheduled",
  "notes": "Interview on Jan 25",
  "changed_by": "recruiter-001"
}
```

**Valid Status Transitions:**
- `applied` → `screening` or `rejected`
- `screening` → `interview_scheduled` or `rejected`
- `interview_scheduled` → `interview_completed` or `rejected`
- `interview_completed` → `offered` or `rejected`
- `offered` → `rejected`

### 6. Get Candidate's Applications
```
GET /candidates/{candidate_id}/applications
```
**Optional filter:**
```
GET /candidates/{candidate_id}/applications?status=offered
```

### 7. Get Job's Applications
```
GET /jobs/{job_id}/applications
```
**Optional filter:**
```
GET /jobs/{job_id}/applications?status=interview_scheduled
```

### 8. Get Statistics
```
GET /applications/stats/dashboard
```
**Shows:**
- Total applications
- Applications by status
- Top jobs
- Average time to offer
- Offer acceptance rate

## Common Workflows

### Workflow 1: Full Hiring Cycle
```
1. Create candidate: POST /candidates
2. Create job: POST /jobs
3. Candidate applies: POST /applications
4. Recruiter screens: PATCH status → screening
5. Schedule interview: PATCH status → interview_scheduled
6. Complete interview: PATCH status → interview_completed
7. Make offer: PATCH status → offered
8. View full history: GET /applications/{app_id}
```

### Workflow 2: Track All Candidates
```
1. Get all applications: GET /candidates/{id}/applications
2. Filter by status: GET /candidates/{id}/applications?status=offered
3. View statistics: GET /candidates/{id}/applications/stats
```

### Workflow 3: Monitor Job Performance
```
1. Get all applications for job: GET /jobs/{id}/applications
2. See applications in progress: GET /jobs/{id}/applications?status=interview_scheduled
3. View job statistics: GET /jobs/{id}/applications/stats
```

## Data is Persistent

- All data is saved to `./applications.db`
- The database persists between server restarts
- To reset: Delete `applications.db` and restart the server

## Database Status

Check what's in your database:
```
GET /applications/stats/dashboard
```

This shows:
- How many applications exist
- How many are in each status
- How many candidates and jobs
- Average time to hire

## Error Messages

**404 Not Found**
```
Means the candidate, job, or application doesn't exist
```

**400 Bad Request**
```
Could be:
- Invalid status transition (e.g., trying to go from applied → offered)
- Already applied to this job
- Invalid data in request
```

**Check the error message** - it tells you what went wrong!

## Tips & Tricks

### 1. Use Meaningful IDs
```json
{
  "id": "user-alice-johnson",
  "id": "job-senior-dev-2024",
  "id": "app-alice-senior-dev"
}
```

### 2. Save Application IDs
When you create an application, save the returned ID - you'll need it to:
- Get details
- Update status
- Check history

### 3. Use Notes for Tracking
```json
{
  "status": "interview_scheduled",
  "notes": "Phone screen scheduled for Jan 20 at 2 PM with hiring manager Bob",
  "changed_by": "recruiter-001"
}
```

### 4. Test in Swagger UI
The interactive Swagger UI at http://localhost:8000/docs is perfect for learning and testing.

## Need Help?

1. **API Documentation**: http://localhost:8000/docs
2. **Full Docs File**: Open `API_DOCUMENTATION.md`
3. **README**: Open `README.md` for detailed setup
4. **Code Examples**: Open `test_api.py` to see working examples
5. **Implementation Guide**: Open `IMPLEMENTATION_SUMMARY.md`

## Next Steps

1. ✅ Get the server running
2. ✅ Try creating a candidate
3. ✅ Try creating a job
4. ✅ Submit an application
5. ✅ Move it through the status flow
6. ✅ Check the full history
7. ✅ View statistics

**You're ready to go!** 🚀
