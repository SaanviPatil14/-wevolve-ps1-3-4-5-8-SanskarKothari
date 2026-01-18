import { Candidate, Job } from "../types";

// Ensure this matches your Python Uvicorn port
const API_URL = "http://127.0.0.1:8000";

export const analyzeSkills = async (payload: any) => {
  try {
    console.log("Sending Analysis Request for:", payload.target_role.title); // Debug log

    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Skill Analysis Service Error:", error);
    // Only return mock data if the backend is dead
    alert(
      "⚠️ Backend connection failed! Showing DEMO data. Check your Python terminal."
    );
    return MOCK_GAP_RESPONSE;
  }
};

// Fallback data only used if Python is offline
const MOCK_GAP_RESPONSE = {
  analysis: {
    skill_gap_percentage: 45,
    readiness_score: 55,
    estimated_learning_time_months: 3,
    missing_skills: ["Backend Connection Failed", "Check Terminal"],
    matching_skills: ["React", "CSS"],
  },
  learning_roadmap: [
    {
      phase: 1,
      duration_months: 1,
      focus: "Connection Troubleshooting",
      skills_to_learn: ["Start Backend", "Check Port 8000"],
      priority: "High",
      reasoning: "The frontend cannot talk to Python.",
    },
  ],
  radar_data: [],
  salary_growth: [],
};
