"""
Unit tests for Multi-Factor Job Matching Engine
Tests skill matching, experience parsing, salary matching, and overall scoring
"""

import pytest
from matching_engine import (
    JobMatchingEngine,
    CandidateMatchProfile,
    JobPostingForMatch,
    EducationModel,
    MatchBreakdown
)


class TestJobMatchingEngine:
    """Test suite for JobMatchingEngine"""
    
    @pytest.fixture
    def engine(self):
        """Create engine instance for testing"""
        return JobMatchingEngine()
    
    @pytest.fixture
    def sample_candidate(self):
        """Create sample candidate profile"""
        return CandidateMatchProfile(
            skills=["Python", "FastAPI", "Docker", "React"],
            experience_years=2,
            preferred_locations=["Bangalore", "Hyderabad"],
            preferred_roles=["Backend Developer", "Full Stack Developer"],
            expected_salary=850000,
            education=EducationModel(
                degree="B.Tech",
                field="Computer Science",
                cgpa=8.5
            )
        )
    
    @pytest.fixture
    def sample_job(self):
        """Create sample job posting"""
        return JobPostingForMatch(
            job_id="J001",
            title="Backend Developer",
            required_skills=["Python", "FastAPI", "PostgreSQL"],
            experience_required="1-3 years",
            location="Bangalore",
            salary_range=[600000, 1000000],
            company="TechCorp"
        )
    
    # ========================================================================
    # TEST 1: SKILL MATCHING
    # ========================================================================
    
    def test_skill_match_perfect_match(self, engine):
        """Test perfect skill match (100% score)"""
        candidate_skills = ["Python", "FastAPI", "Docker"]
        required_skills = ["Python", "FastAPI", "Docker"]
        
        score, matching, missing = engine.calculate_skill_match(candidate_skills, required_skills)
        
        assert score == 100.0, "Perfect match should score 100%"
        assert len(matching) == 3, "Should have 3 matching skills"
        assert len(missing) == 0, "Should have no missing skills"
    
    def test_skill_match_partial_match(self, engine):
        """Test partial skill match"""
        candidate_skills = ["Python", "FastAPI", "React"]
        required_skills = ["Python", "FastAPI", "PostgreSQL"]
        
        score, matching, missing = engine.calculate_skill_match(candidate_skills, required_skills)
        
        assert score == pytest.approx(66.67, 0.1), f"Expected ~66.67%, got {score}%"
        assert "python" in matching or "Python" in matching
        assert "fastapi" in matching or "FastAPI" in matching
        assert "postgresql" in missing or "PostgreSQL" in missing
    
    def test_skill_match_no_match(self, engine):
        """Test no skill match"""
        candidate_skills = ["Java", "C++", "Assembly"]
        required_skills = ["Python", "FastAPI", "PostgreSQL"]
        
        score, matching, missing = engine.calculate_skill_match(candidate_skills, required_skills)
        
        assert score == 0.0, "No matching skills should score 0%"
        assert len(matching) == 0, "Should have no matching skills"
        assert len(missing) == 3, "Should have 3 missing skills"
    
    def test_skill_normalization(self, engine):
        """Test skill name normalization and alias matching"""
        candidate_skills = ["py", "FastAPI", "docker"]  # Using aliases/different cases
        required_skills = ["Python", "fastapi", "Docker"]
        
        score, matching, missing = engine.calculate_skill_match(candidate_skills, required_skills)
        
        assert score == 100.0, "Normalized skills should match"
        assert len(matching) == 3, "Should match after normalization"
    
    def test_skill_match_empty_required(self, engine):
        """Test when no required skills specified"""
        candidate_skills = ["Python", "FastAPI"]
        required_skills = []
        
        score, matching, missing = engine.calculate_skill_match(candidate_skills, required_skills)
        
        assert score == 100.0, "Should score 100% when no required skills"
    
    # ========================================================================
    # TEST 2: EXPERIENCE MATCHING
    # ========================================================================
    
    def test_experience_parse_range(self, engine):
        """Test experience range parsing"""
        assert engine.parse_experience_range("0-2 years") == (0, 2)
        assert engine.parse_experience_range("2-5 yrs") == (2, 5)
        assert engine.parse_experience_range("5+ years") == (5, 99)
        assert engine.parse_experience_range("3 years") == (3, 3)
    
    def test_experience_match_within_range(self, engine):
        """Test experience within required range"""
        score = engine.calculate_experience_match(2, "1-3 years")
        assert score == 100.0, "Experience within range should score 100%"
    
    def test_experience_match_below_range(self, engine):
        """Test experience below required range"""
        score = engine.calculate_experience_match(0, "2-5 years")
        assert score < 100.0, "Below range should score less than 100%"
        assert score >= 0, "Score should not be negative"
    
    def test_experience_match_above_range(self, engine):
        """Test experience above required range (overqualified)"""
        score = engine.calculate_experience_match(7, "2-5 years")
        assert score == 90.0, "Above range should score 90% (overqualified)"
    
    # ========================================================================
    # TEST 3: LOCATION MATCHING
    # ========================================================================
    
    def test_location_match_exact(self, engine):
        """Test exact location match"""
        score = engine.calculate_location_match(["Bangalore", "Hyderabad"], "Bangalore")
        assert score == 100.0, "Exact match should score 100%"
    
    def test_location_match_remote(self, engine):
        """Test remote location match"""
        score = engine.calculate_location_match(["Remote"], "Remote")
        assert score == 100.0, "Remote match should score 100%"
    
    def test_location_match_no_match(self, engine):
        """Test location mismatch"""
        score = engine.calculate_location_match(["Bangalore"], "Mumbai")
        assert score == 0.0, "Mismatched location should score 0%"
    
    def test_location_match_case_insensitive(self, engine):
        """Test case-insensitive location matching"""
        score = engine.calculate_location_match(["bangalore"], "BANGALORE")
        assert score == 100.0, "Case-insensitive match should work"
    
    # ========================================================================
    # TEST 4: SALARY MATCHING
    # ========================================================================
    
    def test_salary_match_within_range(self, engine):
        """Test salary within range"""
        score = engine.calculate_salary_match(800000, [600000, 1000000])
        assert score == 100.0, "Salary within range should score 100%"
    
    def test_salary_match_below_range(self, engine):
        """Test salary below range"""
        score = engine.calculate_salary_match(500000, [600000, 1000000])
        assert score == 100.0, "Salary below range should still score 100% (good for employer)"
    
    def test_salary_match_above_range(self, engine):
        """Test salary above range"""
        score = engine.calculate_salary_match(1200000, [600000, 1000000])
        assert 0 <= score < 100, "Salary above range should score less than 100%"
    
    # ========================================================================
    # TEST 5: ROLE MATCHING
    # ========================================================================
    
    def test_role_match_exact(self, engine):
        """Test exact role match"""
        score = engine.calculate_role_match(["Backend Developer"], "Backend Developer")
        assert score == 100.0, "Exact role match should score 100%"
    
    def test_role_match_partial(self, engine):
        """Test partial role match"""
        score = engine.calculate_role_match(["Backend Developer"], "Senior Backend Developer")
        assert score == 80.0, "Partial role match should score 80%"
    
    def test_role_match_no_match(self, engine):
        """Test role mismatch"""
        score = engine.calculate_role_match(["Frontend Developer"], "Backend Developer")
        assert score == 0.0, "Role mismatch should score 0%"
    
    # ========================================================================
    # TEST 6: OVERALL MATCHING
    # ========================================================================
    
    def test_overall_score_calculation(self, engine):
        """Test overall weighted score calculation"""
        breakdown = MatchBreakdown(
            skill_match=100,
            location_match=100,
            salary_match=100,
            experience_match=100,
            role_match=100
        )
        
        score = engine.calculate_overall_score(breakdown)
        assert score == 100.0, "Perfect scores should result in 100% overall"
    
    def test_overall_score_weights(self, engine):
        """Test that weights are correctly applied"""
        # Test with skill=100, others=0
        breakdown = MatchBreakdown(
            skill_match=100,
            location_match=0,
            salary_match=0,
            experience_match=0,
            role_match=0
        )
        
        score = engine.calculate_overall_score(breakdown)
        expected = 100 * 0.40  # Only skill weight
        assert score == expected, f"Expected {expected}, got {score}"
    
    def test_candidate_to_job_matching(self, engine, sample_candidate, sample_job):
        """Test end-to-end candidate to job matching"""
        result = engine.match_candidate_to_job(sample_candidate, sample_job)
        
        assert result.job_id == "J001"
        assert 0 <= result.match_score <= 100
        assert result.breakdown.skill_match == pytest.approx(66.67, 0.1)
        assert result.breakdown.location_match == 100
        assert "postgresql" in result.missing_skills or "PostgreSQL" in result.missing_skills
        assert "python" in result.matching_skills or "Python" in result.matching_skills
        assert len(result.recommendation_reason) > 0
    
    # ========================================================================
    # TEST 7: EDGE CASES
    # ========================================================================
    
    def test_empty_candidate_skills(self, engine):
        """Test with candidate having no skills"""
        candidate = CandidateMatchProfile(
            skills=[],
            experience_years=0,
            preferred_locations=[],
            preferred_roles=[],
            expected_salary=0
        )
        job = JobPostingForMatch(
            job_id="J001",
            title="Developer",
            required_skills=["Python"],
            experience_required="1+ years",
            location="Bangalore",
            salary_range=[500000, 1000000],
            company="TechCorp"
        )
        
        result = engine.match_candidate_to_job(candidate, job)
        assert result.match_score >= 0, "Should handle empty skills gracefully"
    
    def test_multiple_job_matching(self, engine, sample_candidate):
        """Test matching candidate to multiple jobs"""
        jobs = [
            JobPostingForMatch(
                job_id="J001",
                title="Backend Developer",
                required_skills=["Python", "FastAPI"],
                experience_required="1-3 years",
                location="Bangalore",
                salary_range=[600000, 1000000],
                company="TechCorp"
            ),
            JobPostingForMatch(
                job_id="J002",
                title="Frontend Developer",
                required_skills=["React", "JavaScript"],
                experience_required="2-4 years",
                location="Mumbai",
                salary_range=[700000, 1100000],
                company="WebCorp"
            )
        ]
        
        response = engine.match_candidate_to_jobs(sample_candidate, jobs)
        
        assert response.total_matches == 2
        assert len(response.matches) == 2
        # Verify sorted by score (descending)
        assert response.matches[0].match_score >= response.matches[1].match_score
    
    def test_salary_missing_data(self, engine):
        """Test salary matching with missing salary data"""
        score = engine.calculate_salary_match(800000, [])
        assert score == 50.0, "Missing salary range should score 50% (neutral)"
    
    def test_location_missing_data(self, engine):
        """Test location matching with no preferred locations"""
        score = engine.calculate_location_match([], "Bangalore")
        assert score == 50.0, "No preferred locations should score 50% (neutral)"
    
    # ========================================================================
    # TEST 8: RECOMMENDATION LOGIC
    # ========================================================================
    
    def test_recommendation_perfect_skills(self, engine):
        """Test recommendation message with perfect skill match"""
        candidate = CandidateMatchProfile(
            skills=["Python", "FastAPI"],
            experience_years=2,
            preferred_locations=["Bangalore"],
            preferred_roles=["Backend Developer"],
            expected_salary=800000
        )
        job = JobPostingForMatch(
            job_id="J001",
            title="Backend Developer",
            required_skills=["Python", "FastAPI"],
            experience_required="1-3 years",
            location="Bangalore",
            salary_range=[600000, 1000000],
            company="TechCorp"
        )
        
        result = engine.match_candidate_to_job(candidate, job)
        assert "Perfect skill alignment" in result.recommendation_reason
        assert "2/2" in result.recommendation_reason
    
    def test_recommendation_no_skills(self, engine):
        """Test recommendation message with no skill match"""
        candidate = CandidateMatchProfile(
            skills=["Java", "C++"],
            experience_years=2,
            preferred_locations=["Bangalore"],
            preferred_roles=["Backend Developer"],
            expected_salary=800000
        )
        job = JobPostingForMatch(
            job_id="J001",
            title="Backend Developer",
            required_skills=["Python", "FastAPI"],
            experience_required="1-3 years",
            location="Bangalore",
            salary_range=[600000, 1000000],
            company="TechCorp"
        )
        
        result = engine.match_candidate_to_job(candidate, job)
        assert "No skill matches" in result.recommendation_reason


# ============================================================================
# PYTEST CONFIGURATION
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
