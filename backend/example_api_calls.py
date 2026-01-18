#!/usr/bin/env python3
"""
Multi-Factor Job Matching Engine - Example API Calls
Demonstrates real-world usage of the matching engine
"""

import requests
import json
from typing import Dict, List, Any

BASE_URL = "http://localhost:8000"

# ============================================================================
# EXAMPLE 1: Perfect Skill Match
# ============================================================================

def example_1_perfect_match():
    """
    Candidate with all required skills
    Expected: High match score (80-90%)
    """
    print("\n" + "="*70)
    print("EXAMPLE 1: Perfect Skill Match")
    print("="*70)
    
    request_data = {
        "candidate": {
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "experience_years": 2,
            "preferred_locations": ["Bangalore"],
            "preferred_roles": ["Backend Developer"],
            "expected_salary": 850000,
            "education": {
                "degree": "B.Tech",
                "field": "Computer Science",
                "cgpa": 8.5
            }
        },
        "jobs": [
            {
                "job_id": "J001",
                "title": "Backend Developer",
                "required_skills": ["Python", "FastAPI", "PostgreSQL"],
                "experience_required": "1-3 years",
                "location": "Bangalore",
                "salary_range": [600000, 1000000],
                "company": "TechCorp"
            }
        ]
    }
    
    print("\n📤 Request:")
    print(json.dumps(request_data, indent=2))
    
    response = requests.post(
        f"{BASE_URL}/api/match/candidate-to-jobs",
        json=request_data
    )
    
    print("\n📥 Response:")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    if result["matches"]:
        match = result["matches"][0]
        print(f"\n✨ Match Score: {match['match_score']}%")
        print(f"📍 Location Match: {match['breakdown']['location_match']}%")
        print(f"💼 Skill Match: {match['breakdown']['skill_match']}%")
        print(f"💰 Salary Match: {match['breakdown']['salary_match']}%")


# ============================================================================
# EXAMPLE 2: Partial Match - Missing Skills
# ============================================================================

def example_2_partial_match():
    """
    Candidate missing some required skills
    Expected: Moderate match score (60-75%)
    """
    print("\n" + "="*70)
    print("EXAMPLE 2: Partial Match (Missing Skills)")
    print("="*70)
    
    request_data = {
        "candidate": {
            "skills": ["Python", "FastAPI"],  # Missing PostgreSQL
            "experience_years": 2,
            "preferred_locations": ["Bangalore"],
            "preferred_roles": ["Backend Developer"],
            "expected_salary": 800000,
            "education": {
                "degree": "B.Tech",
                "field": "Computer Science",
                "cgpa": 8.5
            }
        },
        "jobs": [
            {
                "job_id": "J002",
                "title": "Backend Developer",
                "required_skills": ["Python", "FastAPI", "PostgreSQL"],
                "experience_required": "1-3 years",
                "location": "Bangalore",
                "salary_range": [600000, 1000000],
                "company": "TechCorp"
            }
        ]
    }
    
    print("\n📤 Request:")
    print(json.dumps(request_data, indent=2))
    
    response = requests.post(
        f"{BASE_URL}/api/match/candidate-to-jobs",
        json=request_data
    )
    
    print("\n📥 Response:")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    if result["matches"]:
        match = result["matches"][0]
        print(f"\n✨ Match Score: {match['match_score']}%")
        print(f"❌ Missing Skills: {', '.join(match['missing_skills'])}")
        print(f"✅ Matching Skills: {', '.join(match['matching_skills'])}")
        print(f"💡 Recommendation: {match['recommendation_reason']}")


# ============================================================================
# EXAMPLE 3: Multiple Jobs - Ranking
# ============================================================================

def example_3_multiple_jobs():
    """
    Candidate matched against multiple jobs
    Expected: Jobs ranked by match score (descending)
    """
    print("\n" + "="*70)
    print("EXAMPLE 3: Multiple Jobs - Ranking")
    print("="*70)
    
    request_data = {
        "candidate": {
            "skills": ["Python", "FastAPI", "Docker", "React"],
            "experience_years": 2,
            "preferred_locations": ["Bangalore", "Hyderabad"],
            "preferred_roles": ["Backend Developer", "Full Stack Developer"],
            "expected_salary": 900000,
            "education": {
                "degree": "B.Tech",
                "field": "Computer Science",
                "cgpa": 8.2
            }
        },
        "jobs": [
            {
                "job_id": "J001",
                "title": "Backend Developer",
                "required_skills": ["Python", "FastAPI", "PostgreSQL"],
                "experience_required": "1-3 years",
                "location": "Bangalore",
                "salary_range": [700000, 1100000],
                "company": "TechCorp"
            },
            {
                "job_id": "J002",
                "title": "Full Stack Developer",
                "required_skills": ["Python", "FastAPI", "React", "PostgreSQL"],
                "experience_required": "2-4 years",
                "location": "Hyderabad",
                "salary_range": [800000, 1200000],
                "company": "WebCorp"
            },
            {
                "job_id": "J003",
                "title": "Frontend Developer",
                "required_skills": ["React", "JavaScript", "TypeScript"],
                "experience_required": "1-2 years",
                "location": "Mumbai",
                "salary_range": [600000, 900000],
                "company": "UIDesign Co"
            }
        ]
    }
    
    print("\n📤 Request:")
    print(f"Candidate: {request_data['candidate']['skills']}")
    print(f"Jobs to match: {len(request_data['jobs'])}")
    
    response = requests.post(
        f"{BASE_URL}/api/match/candidate-to-jobs",
        json=request_data
    )
    
    print("\n📥 Response:")
    result = response.json()
    
    print(f"\n📊 Total Matches: {result['total_matches']}")
    print("\n🏆 Ranked Results:")
    print("-" * 70)
    
    for i, match in enumerate(result["matches"], 1):
        print(f"\n#{i}. {match['job_title']} at {match['company']}")
        print(f"   Match Score: {match['match_score']}%")
        print(f"   Skills: {match['breakdown']['skill_match']}% | " 
              f"Location: {match['breakdown']['location_match']}% | "
              f"Salary: {match['breakdown']['salary_match']}%")
        print(f"   Missing: {', '.join(match['missing_skills']) if match['missing_skills'] else 'None'}")


# ============================================================================
# EXAMPLE 4: Location Mismatch
# ============================================================================

def example_4_location_mismatch():
    """
    Candidate with strong skills but location mismatch
    Expected: Good skill score but poor location impact
    """
    print("\n" + "="*70)
    print("EXAMPLE 4: Location Mismatch (Skills Strong)")
    print("="*70)
    
    request_data = {
        "candidate": {
            "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
            "experience_years": 3,
            "preferred_locations": ["Remote"],  # Only Remote
            "preferred_roles": ["Backend Developer"],
            "expected_salary": 900000
        },
        "jobs": [
            {
                "job_id": "J001",
                "title": "Backend Developer",
                "required_skills": ["Python", "FastAPI", "PostgreSQL"],
                "experience_required": "2-4 years",
                "location": "Bangalore",  # In-office only
                "salary_range": [700000, 1100000],
                "company": "TechCorp"
            }
        ]
    }
    
    print("\n📤 Request:")
    print(json.dumps(request_data, indent=2))
    
    response = requests.post(
        f"{BASE_URL}/api/match/candidate-to-jobs",
        json=request_data
    )
    
    print("\n📥 Response:")
    result = response.json()
    print(json.dumps(result, indent=2))
    
    if result["matches"]:
        match = result["matches"][0]
        print(f"\n📊 Score Breakdown:")
        print(f"   Skill Match: {match['breakdown']['skill_match']}% (Weight: 40%)")
        print(f"   Location Match: {match['breakdown']['location_match']}% (Weight: 20%) ❌")
        print(f"   Salary Match: {match['breakdown']['salary_match']}% (Weight: 15%)")
        print(f"   Experience Match: {match['breakdown']['experience_match']}% (Weight: 15%)")
        print(f"   Role Match: {match['breakdown']['role_match']}% (Weight: 10%)")
        print(f"\n   Overall: {match['match_score']}%")


# ============================================================================
# EXAMPLE 5: Salary Mismatch
# ============================================================================

def example_5_salary_mismatch():
    """
    Candidate expecting above market rate
    Expected: Salary score reduced but not zero
    """
    print("\n" + "="*70)
    print("EXAMPLE 5: Above Market Salary Expectation")
    print("="*70)
    
    request_data = {
        "candidate": {
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "experience_years": 2,
            "preferred_locations": ["Bangalore"],
            "preferred_roles": ["Backend Developer"],
            "expected_salary": 1500000  # Way above range
        },
        "jobs": [
            {
                "job_id": "J001",
                "title": "Backend Developer",
                "required_skills": ["Python", "FastAPI", "PostgreSQL"],
                "experience_required": "1-3 years",
                "location": "Bangalore",
                "salary_range": [600000, 1000000],  # Max is 1000k
                "company": "TechCorp"
            }
        ]
    }
    
    print("\n📤 Request:")
    print(f"Expected Salary: ₹{request_data['candidate']['expected_salary']:,}")
    print(f"Job Salary Range: ₹{request_data['jobs'][0]['salary_range'][0]:,} - ₹{request_data['jobs'][0]['salary_range'][1]:,}")
    
    response = requests.post(
        f"{BASE_URL}/api/match/candidate-to-jobs",
        json=request_data
    )
    
    print("\n📥 Response:")
    result = response.json()
    
    if result["matches"]:
        match = result["matches"][0]
        print(f"\n💰 Salary Analysis:")
        print(f"   Candidate Expectation: ₹1,500,000")
        print(f"   Job Range: ₹600,000 - ₹1,000,000")
        print(f"   Excess: ₹500,000 (+50%)")
        print(f"   Salary Match Score: {match['breakdown']['salary_match']}%")
        print(f"   Overall Match: {match['match_score']}%")


# ============================================================================
# EXAMPLE 6: Experience Mismatch
# ============================================================================

def example_6_experience_mismatch():
    """
    Candidate with below required experience
    Expected: Experience score proportional to experience gap
    """
    print("\n" + "="*70)
    print("EXAMPLE 6: Below Required Experience")
    print("="*70)
    
    request_data = {
        "candidate": {
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "experience_years": 1,  # Below requirement of 2-4 years
            "preferred_locations": ["Bangalore"],
            "preferred_roles": ["Backend Developer"],
            "expected_salary": 700000
        },
        "jobs": [
            {
                "job_id": "J001",
                "title": "Backend Developer",
                "required_skills": ["Python", "FastAPI", "PostgreSQL"],
                "experience_required": "2-4 years",
                "location": "Bangalore",
                "salary_range": [700000, 1100000],
                "company": "TechCorp"
            }
        ]
    }
    
    print("\n📤 Request:")
    print(f"Candidate Experience: {request_data['candidate']['experience_years']} year(s)")
    print(f"Required Experience: {request_data['jobs'][0]['experience_required']}")
    
    response = requests.post(
        f"{BASE_URL}/api/match/candidate-to-jobs",
        json=request_data
    )
    
    print("\n📥 Response:")
    result = response.json()
    
    if result["matches"]:
        match = result["matches"][0]
        print(f"\n📈 Experience Analysis:")
        print(f"   Experience Match Score: {match['breakdown']['experience_match']}%")
        print(f"   Overall Match: {match['match_score']}%")
        print(f"   💡 Tip: Junior candidate with strong skills")


# ============================================================================
# EXAMPLE 7: Remote Position
# ============================================================================

def example_7_remote_position():
    """
    Candidate looking for remote work
    Expected: Perfect location match
    """
    print("\n" + "="*70)
    print("EXAMPLE 7: Remote Position Match")
    print("="*70)
    
    request_data = {
        "candidate": {
            "skills": ["Python", "FastAPI"],
            "experience_years": 3,
            "preferred_locations": ["Remote"],  # Remote worker
            "preferred_roles": ["Backend Developer"],
            "expected_salary": 800000
        },
        "jobs": [
            {
                "job_id": "J001",
                "title": "Backend Developer (Remote)",
                "required_skills": ["Python", "FastAPI"],
                "experience_required": "2-4 years",
                "location": "Remote",  # Remote job
                "salary_range": [700000, 1100000],
                "company": "TechCorp"
            }
        ]
    }
    
    print("\n📤 Request:")
    print(f"Preferred Location: {request_data['candidate']['preferred_locations']}")
    print(f"Job Location: {request_data['jobs'][0]['location']}")
    
    response = requests.post(
        f"{BASE_URL}/api/match/candidate-to-jobs",
        json=request_data
    )
    
    print("\n📥 Response:")
    result = response.json()
    
    if result["matches"]:
        match = result["matches"][0]
        print(f"\n🌍 Remote Analysis:")
        print(f"   Location Match Score: {match['breakdown']['location_match']}% ✅")
        print(f"   Overall Match: {match['match_score']}%")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Run all examples"""
    print("\n" + "="*70)
    print("MULTI-FACTOR JOB MATCHING ENGINE - API EXAMPLES")
    print("="*70)
    print("\n⚠️  Make sure the FastAPI server is running:")
    print("   cd backend && python -m uvicorn main:app --reload")
    print("\n" + "="*70)
    
    try:
        # Test connection
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Server is running!")
        else:
            print("❌ Server returned error")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Please start the FastAPI server first:")
        print("   cd backend && python -m uvicorn main:app --reload")
        return
    
    # Run examples
    try:
        example_1_perfect_match()
        example_2_partial_match()
        example_3_multiple_jobs()
        example_4_location_mismatch()
        example_5_salary_mismatch()
        example_6_experience_mismatch()
        example_7_remote_position()
        
        print("\n" + "="*70)
        print("✅ All examples completed successfully!")
        print("="*70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
