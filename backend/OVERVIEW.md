# Application Lifecycle Management System - Overview

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      FastAPI Server                            │
│                    (main.py - 600+ lines)                      │
└────────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┬────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
    ┌──────────┐         ┌──────────┐      ┌──────────────┐
    │ Pydantic │         │SQLAlchemy│      │ HTTP Status  │
    │ Schemas  │         │ ORM      │      │   Codes      │
    │          │         │ Models   │      │              │
    └──────────┘         └──────────┘      └──────────────┘
         │                    │
         └────────────────────┴──────────────────┬────────┐
                              ↓                  ↓
                    ┌─────────────────┐  ┌──────────────┐
                    │  SQLite DB      │  │  JSON API    │
                    │ applications.db │  │  Responses   │
                    └─────────────────┘  └──────────────┘
```

## 📊 Data Model Relationships

```
┌─────────────────┐              ┌──────────────────┐
│   Candidate     │              │       Job        │
├─────────────────┤              ├──────────────────┤
│ • id (PK)       │              │ • id (PK)        │
│ • name          │              │ • title          │
│ • email         │              │ • company        │
│ • resume_url    │              │ • status         │
│ • created_at    │              │ • description    │
│ • updated_at    │              │ • created_at     │
└────────┬────────┘              └────────┬─────────┘
         │                                │
         │ (1:M)                   (1:M) │
         │                                │
         └────────────────┬───────────────┘
                          ▼
                  ┌─────────────────┐
                  │  Application    │
                  ├─────────────────┤
                  │ • id (PK)       │
                  │ • job_id (FK)   │
                  │ • candidate_id  │
                  │ • status        │
                  │ • applied_at    │
                  │ • updated_at    │
                  └────────┬────────┘
                           │ (1:M)
                           ▼
                  ┌─────────────────────┐
                  │  StatusHistory      │
                  ├─────────────────────┤
                  │ • id (PK)           │
                  │ • application_id    │
                  │ • old_status        │
                  │ • new_status        │
                  │ • changed_at        │
                  │ • notes             │
                  │ • changed_by        │
                  └─────────────────────┘
```

## 🔄 Application Lifecycle

```
START
  │
  ▼
┌─────────────────────────────────────────┐
│ Candidate Applies                       │
│ POST /applications                      │
│ Status: APPLIED                         │
│ History Entry Created ✓                 │
└─────────────────────────────────────────┘
  │
  ├─────────────────────────────────────────────┐
  │                                             │
  ▼                                             ▼
┌──────────────┐                        ┌──────────────┐
│ SCREENING    │                        │  REJECTED ✗  │
│ Resume Review│                        └──────────────┘
└──────┬───────┘
  │
  ├─────────────────────────────────────────────┐
  │                                             │
  ▼                                             ▼
┌──────────────┐                        ┌──────────────┐
│INTERVIEW     │                        │  REJECTED ✗  │
│SCHEDULED     │                        └──────────────┘
└──────┬───────┘
  │
  ├─────────────────────────────────────────────┐
  │                                             │
  ▼                                             ▼
┌──────────────┐                        ┌──────────────┐
│INTERVIEW     │                        │  REJECTED ✗  │
│COMPLETED     │                        └──────────────┘
└──────┬───────┘
  │
  ├──────────────────────────────────────────────────┐
  │                                                  │
  ▼                                                  ▼
┌──────────────┐                        ┌──────────────┐
│   OFFERED    │                        │  REJECTED ✗  │
│ Job Offered  │                        └──────────────┘
└──────┬───────┘
  │
  ├─────────────────────────────────────────────┐
  │                                             │
  ▼                                             ▼
 ACCEPT                                   REJECT ✗
 
 HIRED ✓

Each transition records:
  ✓ Old Status
  ✓ New Status
  ✓ Timestamp
  ✓ Notes (optional)
  ✓ Changed By (optional)
```

## 🎯 API Endpoint Groups

### 1️⃣ Candidate Management (2 Endpoints)
```
POST   /candidates                     Create candidate
GET    /candidates/{id}                Get candidate details
```

### 2️⃣ Job Management (2 Endpoints)
```
POST   /jobs                           Create job posting
GET    /jobs/{id}                      Get job details
```

### 3️⃣ Application Lifecycle (3 Endpoints)
```
POST   /applications                   Submit application
GET    /applications/{id}              Get with full history
PATCH  /applications/{id}/status       Update status & record change
```

### 4️⃣ Candidate Applications (2 Endpoints)
```
GET    /candidates/{id}/applications   List all applications
GET    /candidates/{id}/applications/stats  Statistics
```

### 5️⃣ Job Applications (2 Endpoints)
```
GET    /jobs/{id}/applications         List all applications
GET    /jobs/{id}/applications/stats   Statistics
```

### 6️⃣ Analytics & Monitoring (2 Endpoints)
```
GET    /applications/stats/dashboard   Overall metrics
GET    /health                         Service health
```

**Total: 15 Endpoints**

## 📊 Statistics Provided

### Dashboard Statistics
```json
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
  "total_candidates": 120,
  "total_jobs": 15,
  "average_time_to_offer": 14.5,
  "offer_acceptance_rate": 5.33
}
```

### Job-Specific
```
Total Applications
By Status Breakdown
```

### Candidate-Specific
```
Total Applications
Applications by Status
Offers Received
Rejections Count
```

## 💾 File Structure

```
backend/
├── main.py                         FastAPI application
├── models.py                       Database models
├── schemas.py                      Request/response models
├── requirements.txt                Dependencies
├── applications.db                 SQLite database (auto-created)
│
├── QUICKSTART.md                   5-minute setup
├── README.md                       Full documentation
├── API_DOCUMENTATION.md            API reference
├── IMPLEMENTATION_SUMMARY.md       What was built
├── DELIVERY_SUMMARY.md             This delivery
└── test_api.py                     Test script
```

## 🔐 Status Transition Rules

```
Valid Transitions:
├── applied → [screening, rejected]
├── screening → [interview_scheduled, rejected]
├── interview_scheduled → [interview_completed, rejected]
├── interview_completed → [offered, rejected]
├── offered → [rejected]
└── rejected → [NONE - Terminal State]

Invalid Transitions:
├── applied → offered ✗ (Must go through stages)
├── screening → offered ✗ (Must go through stages)
└── rejected → screening ✗ (Cannot revert)
```

## ⚡ Key Features

### ✅ Audit Trail
Every change is tracked with:
- Timestamp
- Old status
- New status
- Optional notes
- Optional changed_by (user ID)
- Immutable records

### ✅ Duplicate Prevention
- Candidates can only apply once per job
- Enforced at database level
- Clear error message if violated

### ✅ Real-Time Statistics
- Calculated from current database state
- No denormalization needed
- Always accurate

### ✅ RESTful Design
- Proper HTTP methods
- Correct status codes
- Clean endpoints
- JSON request/response

### ✅ Type Safety
- Pydantic validation
- SQLAlchemy ORM
- Python type hints
- Enum validation

### ✅ Error Handling
- 404 for missing resources
- 400 for invalid data
- 500 for server errors
- Clear error messages

## 🚀 Quick Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload

# Test all endpoints
python test_api.py

# View API docs
open http://localhost:8000/docs

# View alternative docs
open http://localhost:8000/redoc

# Health check
curl http://localhost:8000/health
```

## 📈 Request/Response Example

### Request
```bash
PATCH /applications/app-789/status
Content-Type: application/json

{
  "status": "interview_scheduled",
  "notes": "Interview scheduled for Jan 25 at 2 PM",
  "changed_by": "recruiter-001"
}
```

### Response
```json
{
  "id": "app-789",
  "job_id": "job-456",
  "candidate_id": "candidate-123",
  "status": "interview_scheduled",
  "applied_at": "2024-01-18T10:05:00",
  "updated_at": "2024-01-18T11:30:00",
  "candidate": { ... },
  "job": { ... },
  "status_history": [
    {
      "id": "hist-1",
      "old_status": null,
      "new_status": "applied",
      "changed_at": "2024-01-18T10:05:00",
      "notes": "Application submitted"
    },
    {
      "id": "hist-2",
      "old_status": "applied",
      "new_status": "screening",
      "changed_at": "2024-01-18T10:30:00",
      "notes": "Passed initial screening"
    },
    {
      "id": "hist-3",
      "old_status": "screening",
      "new_status": "interview_scheduled",
      "changed_at": "2024-01-18T11:30:00",
      "notes": "Interview scheduled for Jan 25 at 2 PM",
      "changed_by": "recruiter-001"
    }
  ]
}
```

## 🎓 Documentation Roadmap

1. **Start Here** → `QUICKSTART.md` (5 min read)
2. **Setup** → `README.md` (10 min read)
3. **API Details** → `API_DOCUMENTATION.md` (reference)
4. **How It Works** → `IMPLEMENTATION_SUMMARY.md` (10 min read)
5. **Code Examples** → Run `test_api.py`
6. **Interactive Docs** → Visit `/docs` (Swagger UI)

## ✨ Special Features

🎯 **Status Validation**
Invalid transitions are rejected immediately with clear error messages.

🔍 **Full History**
Every application comes with complete audit trail showing every status change.

📊 **Rich Analytics**
Dashboard shows hiring funnel, conversion rates, and time metrics.

🛡️ **Data Integrity**
Proper foreign keys, constraints, and validation prevent bad data.

📝 **Immutable Audit Log**
Status history cannot be deleted or modified - perfect for compliance.

🔄 **Idempotent Operations**
Creating same candidate twice returns existing record instead of error.

---

**Ready to use! Start with QUICKSTART.md** 🚀
