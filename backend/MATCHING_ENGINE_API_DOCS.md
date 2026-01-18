# Multi-Factor Job Matching Engine API Documentation

## Overview

The Multi-Factor Job Matching Engine is a sophisticated RESTful API that matches candidates to job postings using a weighted scoring algorithm. It evaluates compatibility across five key dimensions: skills, location, salary, experience, and role.

## Weights & Scoring

The matching engine uses the following weighted formula:

```
Overall Score = (Skill×0.40) + (Location×0.20) + (Salary×0.15) + (Experience×0.15) + (Role×0.10)
```

### Weight Breakdown

| Factor | Weight | Description |
|--------|--------|-------------|
| **Skill Match** | 40% | Technical skill alignment |
| **Location Match** | 20% | Preferred location match |
| **Salary Match** | 15% | Salary expectation alignment |
| **Experience Match** | 15% | Experience level suitability |
| **Role Match** | 10% | Job title preference match |

## API Endpoints

### 1. Match Candidate to Jobs

**Endpoint:** `POST /api/match/candidate-to-jobs`

**Description:** Matches a candidate profile against multiple job postings and returns ranked results.

#### Request Format

```json
{
  "candidate": {
    "skills": ["Python", "FastAPI", "Docker", "React"],
    "experience_years": 2,
    "preferred_locations": ["Bangalore", "Hyderabad"],
    "preferred_roles": ["Backend Developer", "Full Stack Developer"],
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
      "company": "TechCorp",
      "description": "Looking for a backend developer..."
    }
  ]
}
```

#### Response Format

```json
{
  "matches": [
    {
      "job_id": "J001",
      "job_title": "Backend Developer",
      "company": "TechCorp",
      "match_score": 86.67,
      "breakdown": {
        "skill_match": 66.67,
        "location_match": 100,
        "salary_match": 100,
        "experience_match": 100,
        "role_match": 100
      },
      "missing_skills": ["postgresql"],
      "matching_skills": ["python", "fastapi"],
      "recommendation_reason": "Strong skill alignment with 2/3 matching skills. Preferred location match."
    }
  ],
  "total_matches": 1
}
```

#### Status Codes

- `200 OK` - Successful match
- `400 Bad Request` - Invalid input (missing skills, no jobs, etc.)
- `500 Internal Server Error` - Server error during matching

#### Response Fields

- **match_score** (0-100): Overall compatibility score
- **skill_match**: Percentage of required skills candidate possesses
- **location_match**: 100 if preferred, 0 otherwise
- **salary_match**: Based on overlap with salary range
- **experience_match**: Based on required experience range
- **role_match**: Based on role preferences
- **missing_skills**: Required skills candidate doesn't have
- **matching_skills**: Required skills candidate possesses
- **recommendation_reason**: Human-readable match summary

---

### 2. Get Matching Weights

**Endpoint:** `GET /api/match/engine/weights`

**Description:** Returns the weight configuration used in the matching algorithm.

#### Response Format

```json
{
  "weights": {
    "skill": 0.4,
    "location": 0.2,
    "salary": 0.15,
    "experience": 0.15,
    "role": 0.1
  },
  "total": 1.0,
  "description": {
    "skill": "Technical skill alignment (40%)",
    "location": "Location preference match (20%)",
    "salary": "Salary expectation alignment (15%)",
    "experience": "Experience level match (15%)",
    "role": "Job title preference match (10%)"
  }
}
```

---

## Scoring Logic

### Skill Match (40%)

- **Perfect Match**: 100% - All required skills present
- **Partial Match**: (matching_count / required_count) × 100
- **No Match**: 0% - No required skills present
- **Normalization**: Skills are case-insensitive and match aliases
  - "py" matches "Python"
  - "node" matches "NodeJS"
  - "postgres" matches "PostgreSQL"

### Location Match (20%)

- **Exact Match**: 100% - Preferred location matches job location
- **Remote**: 100% - Remote position matches remote preference
- **No Match**: 0% - Job location not in preferences
- **Case Insensitive**: "bangalore" = "Bangalore"

### Salary Match (15%)

- **Within Range**: 100% - Expected salary within job range
- **Below Range**: 100% - Candidate expects less (favorable to employer)
- **Above Range**: 100 - (excess_percentage) - Penalty for expecting above max
- **Missing Data**: 50% - Neutral when salary not specified

### Experience Match (15%)

- **Within Range**: 100% - Experience matches required range
- **Below Range**: (candidate_years / required_min) × 100 - Proportional penalty
- **Above Range**: 90% - Slightly lower (considered overqualified)
- **Flexible Ranges**: Supports "0-2 years", "2-5 yrs", "5+ years", "3 years"

### Role Match (10%)

- **Exact Match**: 100% - Job title exactly matches preference
- **Partial Match**: 80% - Job title contains preference keyword
- **No Match**: 0% - No overlap with role preferences
- **Multiple Preferences**: Matches against any preference

---

## Data Models

### CandidateMatchProfile

```python
{
  "skills": List[str],              # Required: List of skills
  "experience_years": int,          # Required: Years of experience
  "preferred_locations": List[str], # Required: Preferred job locations
  "preferred_roles": List[str],     # Required: Preferred job roles
  "expected_salary": float,         # Required: Expected annual salary
  "education": Optional[{           # Optional
    "degree": str,                  # e.g., "B.Tech", "M.Tech"
    "field": str,                   # e.g., "Computer Science"
    "cgpa": float                   # GPA/CGPA (0-10 scale)
  }]
}
```

### JobPostingForMatch

```python
{
  "job_id": str,                    # Unique job identifier
  "title": str,                     # Job title
  "required_skills": List[str],     # Skills required
  "experience_required": str,       # e.g., "1-3 years", "5+ years"
  "location": str,                  # Job location
  "salary_range": List[float],      # [min, max] salary range
  "company": str,                   # Company name
  "description": Optional[str]      # Job description
}
```

### JobMatchResult

```python
{
  "job_id": str,
  "job_title": str,
  "company": str,
  "match_score": float,             # 0-100
  "breakdown": {
    "skill_match": float,
    "location_match": float,
    "salary_match": float,
    "experience_match": float,
    "role_match": float
  },
  "missing_skills": List[str],
  "matching_skills": List[str],
  "recommendation_reason": str
}
```

---

## Example Usage

### cURL Example

```bash
curl -X POST http://localhost:8000/api/match/candidate-to-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "candidate": {
      "skills": ["Python", "FastAPI", "Docker"],
      "experience_years": 2,
      "preferred_locations": ["Bangalore"],
      "preferred_roles": ["Backend Developer"],
      "expected_salary": 850000
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
  }'
```

### Python Example

```python
import requests

url = "http://localhost:8000/api/match/candidate-to-jobs"

payload = {
    "candidate": {
        "skills": ["Python", "FastAPI", "Docker"],
        "experience_years": 2,
        "preferred_locations": ["Bangalore"],
        "preferred_roles": ["Backend Developer"],
        "expected_salary": 850000
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

response = requests.post(url, json=payload)
matches = response.json()

for match in matches["matches"]:
    print(f"{match['job_title']} at {match['company']}: {match['match_score']}%")
```

---

## Edge Cases Handled

1. **Empty Skills**: Candidate with no skills - scores 0% on skill match
2. **Empty Jobs**: API validates at least one job in request
3. **Missing Education**: Education is optional, doesn't affect score
4. **No Location Preference**: Returns 50% (neutral) on location match
5. **Salary Out of Range**: Gracefully handles above/below range scenarios
6. **Unknown Experience Format**: Attempts to parse various formats
7. **Case Sensitivity**: All string comparisons are case-insensitive
8. **Skill Aliases**: Normalizes skill names using taxonomy (py→python)

---

## Testing

The implementation includes **28 comprehensive unit tests** covering:

✅ Perfect skill matches
✅ Partial skill matches
✅ No skill matches
✅ Skill normalization & aliases
✅ Experience range parsing
✅ Location matching variations
✅ Salary edge cases
✅ Role matching logic
✅ Overall weighted scoring
✅ Multiple job matching
✅ Edge cases & missing data
✅ Recommendation message generation

**Run tests:**
```bash
pytest test_matching_engine.py -v
```

**Result:** 28/28 tests passing ✅

---

## Performance

- **Single Match**: ~1-2ms
- **100 Jobs**: ~150-200ms
- **Memory**: ~1MB for algorithm + input data

---

## Future Enhancements

1. **ML-based Matching**: Add ML model for soft skill matching
2. **Caching**: Cache taxonomy and scoring weights
3. **Batch Processing**: Support bulk matching operations
4. **Analytics**: Track matching success rates
5. **Feedback Loop**: Learn from accepted/rejected matches
6. **Company-Specific Weights**: Allow custom weights per company
7. **Skill Level Matching**: Distinguish between beginner/intermediate/expert
8. **Interview Success Prediction**: Estimate interview pass probability

---

## Error Handling

### 400 Bad Request

```json
{
  "detail": "Candidate must have at least one skill"
}
```

### 500 Internal Server Error

```json
{
  "detail": "Matching error: [error details]"
}
```

---

## Integration with Existing System

The matching engine integrates with:
- **Firestore**: Candidate profiles and job postings
- **Firebase Auth**: User authentication
- **Application Tracker**: Links matches to applications

---

For more information, visit the [GitHub Repository](https://github.com/yourrepo) or contact support.
