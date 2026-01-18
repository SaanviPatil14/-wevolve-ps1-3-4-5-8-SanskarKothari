Wevolve – AI-Powered Hiring Platform

Wevolve is an end-to-end hiring and career intelligence platform that helps job seekers discover relevant jobs, enables employers to hire efficiently, and provides full transparency across the hiring lifecycle.
The system combines intelligent job matching, modern job discovery UI, application tracking, and AI-generated job descriptions into a single scalable solution.

Key Features
Multi-Factor Job Matching
Matches candidates to jobs using weighted factors
Skills, location, salary, experience, and role fit
Explainable match scores and rankings

Job Discovery Dashboard
React-based responsive UI
Smart filters and real-time search
Visual match score indicators

Application Tracking System (ATS)
Full application lifecycle management
Enforced status flow with audit trail
Candidate, job, and dashboard analytics

AI Job Description Generator
Generates structured, ATS-friendly job descriptions
Minimal input required from employers
Consistent and professional output

Tech Stack

Backend: FastAPI, Python, SQLAlchemy, SQLite
Frontend: React, Hooks, Tailwind CSS / Material UI
Docs: Swagger UI, ReDoc

Project Structure
wevolve/
├── backend/     # FastAPI backend & APIs
├── frontend/    # React job discovery UI
└── README.md

Run Locally
Backend (FastAPI)

cd backend

python -m venv venv

source venv/bin/activate      # Windows: venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload

Backend runs at:
👉 http://localhost:8000
Docs: http://localhost:8000/docs

Frontend (React)
cd frontend
npm install
npm start

Frontend runs at:
👉 http://localhost:3000
