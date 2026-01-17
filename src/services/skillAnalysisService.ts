// If backend isn't running, this mocks the response so your UI doesn't break
export const analyzeSkills = async (data: any) => {
  try {
    const response = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.warn("Backend unavailable, using mock data");
    return MOCK_RESPONSE; // Use the mock object from your prompt here for fallback
  }
};

const MOCK_RESPONSE = {
  analysis: {
    skill_gap_percentage: 70,
    readiness_score: 30,
    estimated_learning_time_months: 8,
    missing_skills: ["React", "Docker", "Kubernetes", "PostgreSQL"],
    matching_skills: ["Python", "FastAPI"],
  },
  learning_roadmap: [
    {
      phase: 1,
      duration_months: 2,
      focus: "Frontend Fundamentals",
      skills_to_learn: ["React"],
      priority: "High",
    },
    {
      phase: 2,
      duration_months: 3,
      focus: "DevOps & Cloud",
      skills_to_learn: ["Docker", "Kubernetes"],
      priority: "Medium",
    },
  ],
  radar_data: [
    { subject: "Frontend", A: 0, B: 100, fullMark: 100 },
    { subject: "Backend", A: 200, B: 200, fullMark: 200 },
    { subject: "DevOps", A: 0, B: 300, fullMark: 300 },
    { subject: "Database", A: 50, B: 150, fullMark: 150 },
  ],
};
