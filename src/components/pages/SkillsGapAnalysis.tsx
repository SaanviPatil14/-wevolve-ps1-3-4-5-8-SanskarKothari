import React, { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { analyzeSkills } from "../../services/skillAnalysisService";

const SkillsGapAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Hardcoded input for demo
  const handleAnalyze = async () => {
    setLoading(true);
    const payload = {
      candidate: {
        current_role: "Junior Backend Developer",
        current_skills: ["Python", "FastAPI", "MySQL", "Git"],
        experience_years: 1,
        education: "B.Tech CS",
      },
      target_role: {
        title: "Senior Full Stack Developer",
        required_skills: [
          "Python",
          "FastAPI",
          "React",
          "Docker",
          "Kubernetes",
          "PostgreSQL",
          "Redis",
          "AWS",
          "CI/CD",
          "System Design",
        ],
        typical_experience: "3-5 years",
      },
    };

    // Call the service
    const data = await analyzeSkills(payload);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Skill Gap Analysis Engine
        </h1>
        <p className="text-gray-600">
          Analyze your path from Junior Backend to Senior Full Stack
        </p>
        <button
          onClick={handleAnalyze}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Key Metrics Cards */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
              <h3 className="text-gray-500 text-sm">Gap Percentage</h3>
              <p className="text-3xl font-bold text-gray-800">
                {result.analysis.skill_gap_percentage}%
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
              <h3 className="text-gray-500 text-sm">Readiness Score</h3>
              <p className="text-3xl font-bold text-gray-800">
                {result.analysis.readiness_score}/100
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
              <h3 className="text-gray-500 text-sm">Est. Learning Time</h3>
              <p className="text-3xl font-bold text-gray-800">
                {result.analysis.estimated_learning_time_months} Months
              </p>
            </div>
          </div>

          {/* 2. Visualizations */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              Skill Proficiency: Current vs Target
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={result.radar_data}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
                  <Radar
                    name="You"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Target"
                    dataKey="B"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              Missing Skills Breakdown
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.analysis.missing_skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
            <h3 className="text-lg font-semibold mt-6 mb-4">Matching Skills</h3>
            <div className="flex flex-wrap gap-2">
              {result.analysis.matching_skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Learning Roadmap */}
          <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-6">
              Personalized Learning Roadmap
            </h3>
            <div className="relative border-l-2 border-blue-200 ml-4 space-y-8">
              {result.learning_roadmap.map((phase: any, index: number) => (
                <div key={index} className="relative pl-8">
                  <div className="absolute -left-2.5 top-0 w-5 h-5 bg-blue-600 rounded-full border-4 border-white"></div>
                  <h4 className="text-lg font-bold text-gray-800">
                    Phase {phase.phase}: {phase.focus}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Duration: {phase.duration_months} months • Priority:{" "}
                    {phase.priority}
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-semibold text-blue-800 mb-1">
                      Skills to Learn:
                    </p>
                    <div className="flex gap-2">
                      {phase.skills_to_learn.map((s: string) => (
                        <span
                          key={s}
                          className="text-sm bg-white border border-blue-200 px-2 py-0.5 rounded text-blue-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      "{phase.reasoning}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ▼▼▼ THIS IS THE MOST IMPORTANT LINE ▼▼▼
export default SkillsGapAnalysis;
