"""
Test script for Application Lifecycle Management API
Run this to test all endpoints
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2, default=str))
    except:
        print(response.text)

def test_api():
    """Run all API tests"""
    
    # 1. Create Candidates
    print("\n>>> Creating Candidates...")
    candidate_data = {
        "id": "cand-001",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "resume_url": "https://example.com/alice_resume.pdf"
    }
    resp = requests.post(f"{BASE_URL}/candidates", json=candidate_data)
    print_response("Create Candidate", resp)
    
    # 2. Create Job
    print("\n>>> Creating Job...")
    job_data = {
        "id": "job-001",
        "title": "Senior Full Stack Developer",
        "company": "TechCorp Inc",
        "description": "We are looking for an experienced full stack developer with 5+ years of experience",
        "status": "open"
    }
    resp = requests.post(f"{BASE_URL}/jobs", json=job_data)
    print_response("Create Job", resp)
    
    # 3. Submit Application
    print("\n>>> Submitting Application...")
    app_data = {
        "job_id": "job-001",
        "candidate_id": "cand-001"
    }
    resp = requests.post(f"{BASE_URL}/applications", json=app_data)
    print_response("Submit Application", resp)
    app_id = resp.json()["id"] if resp.status_code == 201 else None
    
    # 4. Get Application Details
    if app_id:
        print("\n>>> Getting Application Details...")
        resp = requests.get(f"{BASE_URL}/applications/{app_id}")
        print_response("Get Application Details", resp)
        
        # 5. Update Status to Screening
        print("\n>>> Updating Status to SCREENING...")
        update_data = {
            "status": "screening",
            "notes": "Resume review completed - qualified for next round",
            "changed_by": "recruiter-001"
        }
        resp = requests.patch(f"{BASE_URL}/applications/{app_id}/status", json=update_data)
        print_response("Update Status to Screening", resp)
        
        # 6. Update Status to Interview Scheduled
        print("\n>>> Updating Status to INTERVIEW_SCHEDULED...")
        update_data = {
            "status": "interview_scheduled",
            "notes": "Interview scheduled for Jan 25, 2024 at 2:00 PM",
            "changed_by": "recruiter-001"
        }
        resp = requests.patch(f"{BASE_URL}/applications/{app_id}/status", json=update_data)
        print_response("Update Status to Interview Scheduled", resp)
        
        # 7. Update Status to Interview Completed
        print("\n>>> Updating Status to INTERVIEW_COMPLETED...")
        update_data = {
            "status": "interview_completed",
            "notes": "Excellent technical interview. Strong cultural fit.",
            "changed_by": "hiring-manager-001"
        }
        resp = requests.patch(f"{BASE_URL}/applications/{app_id}/status", json=update_data)
        print_response("Update Status to Interview Completed", resp)
        
        # 8. Update Status to Offered
        print("\n>>> Updating Status to OFFERED...")
        update_data = {
            "status": "offered",
            "notes": "Offer letter sent. Salary: $120,000/year",
            "changed_by": "hiring-manager-001"
        }
        resp = requests.patch(f"{BASE_URL}/applications/{app_id}/status", json=update_data)
        print_response("Update Status to Offered", resp)
    
    # 9. Get Candidate's Applications
    print("\n>>> Getting Candidate's All Applications...")
    resp = requests.get(f"{BASE_URL}/candidates/cand-001/applications")
    print_response("Get Candidate Applications", resp)
    
    # 10. Get Job's Applications
    print("\n>>> Getting Job's Applications...")
    resp = requests.get(f"{BASE_URL}/jobs/job-001/applications")
    print_response("Get Job Applications", resp)
    
    # 11. Get Candidate Stats
    print("\n>>> Getting Candidate Application Stats...")
    resp = requests.get(f"{BASE_URL}/candidates/cand-001/applications/stats")
    print_response("Candidate Application Stats", resp)
    
    # 12. Get Job Stats
    print("\n>>> Getting Job Application Stats...")
    resp = requests.get(f"{BASE_URL}/jobs/job-001/applications/stats")
    print_response("Job Application Stats", resp)
    
    # 13. Get Overall Dashboard Stats
    print("\n>>> Getting Overall Dashboard Statistics...")
    resp = requests.get(f"{BASE_URL}/applications/stats/dashboard")
    print_response("Dashboard Statistics", resp)
    
    # 14. Health Check
    print("\n>>> Health Check...")
    resp = requests.get(f"{BASE_URL}/health")
    print_response("Health Check", resp)

if __name__ == "__main__":
    print("Starting API Tests...")
    print(f"Base URL: {BASE_URL}")
    
    try:
        test_api()
        print("\n" + "="*60)
        print("All tests completed!")
        print("="*60)
    except requests.exceptions.ConnectionError:
        print(f"\nError: Cannot connect to {BASE_URL}")
        print("Make sure the server is running: uvicorn main:app --reload")
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
