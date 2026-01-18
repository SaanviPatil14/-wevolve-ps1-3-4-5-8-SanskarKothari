import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { analyzeSkills } from "../../services/skillAnalysisService";
import { Candidate, Job } from "../../types";

const SkillsGapAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  const { candidate, job } =
    (location.state as { candidate: Candidate; job: Job }) || {};

  useEffect(() => {
    if (!candidate || !job) {
      const timer = setTimeout(() => {
        alert("Please select a job from the dashboard to analyze.");
        navigate("/candidate-dashboard");
      }, 100);
      return () => clearTimeout(timer);
    }

    const fetchData = async () => {
      setLoading(true);
      const payload = {
        candidate: {
          current_role: candidate.current_role || "Aspiring Developer",
          current_skills: candidate.skills || [],
          experience_years: candidate.experience_years || 0,
          education: candidate.education?.degree || "Not Specified",
        },
        target_role: {
          title: job.title,
          required_skills: job.required_skills || [],
          typical_experience: job.experience_required || "0-1 years",
        },
      };

      try {
        const data = await analyzeSkills(payload);
        setResult(data);
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [candidate, job, navigate]);

  if (!candidate || !job) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-lg hover:bg-gray-100 transition shadow-sm"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gap Analysis: {job.title}
          </h1>
          <p className="text-gray-600">
            Targeting{" "}
            <span className="font-semibold text-indigo-600">{job.company}</span>{" "}
            • Based on your profile
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-800 font-medium animate-pulse">
            Calculating optimal learning path...
          </p>
        </div>
      ) : (
        result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* 1. Key Metrics Cards */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                  Skill Gap
                </h3>
                <p className="text-4xl font-black text-slate-800 mt-2">
                  {result.analysis.skill_gap_percentage}%
                </p>
                <p className="text-xs text-red-400 font-medium mt-1">
                  Missing Skills
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                  Estimated Time
                </h3>
                <p className="text-4xl font-black text-slate-800 mt-2">
                  {result.analysis.estimated_learning_time_months}
                </p>
                <p className="text-xs text-blue-400 font-medium mt-1">
                  Months to Master
                </p>
              </div>
            </div>

            {/* 2. Radar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-800">
                Skill Proficiency Map
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    data={result.radar_data}
                  >
                    <PolarGrid />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="You"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Target"
                      dataKey="B"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.5}
                    />
                    <Legend />
                    <Tooltip contentStyle={{ borderRadius: "12px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Salary Growth Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Projected Salary Growth
                  </h3>
                  <p className="text-sm text-slate-500">
                    ROI after mastering skills
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  +Potential
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.salary_growth}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                    />
                    <Tooltip
                      formatter={(val: number) => [
                        `₹${val.toLocaleString()}`,
                        "Salary",
                      ]}
                      contentStyle={{ borderRadius: "12px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="salary"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Missing Skills Details */}
            <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-800">
                Critical Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.analysis.missing_skills.length > 0 ? (
                  result.analysis.missing_skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg">
                    <span>✨ Perfect Match! You have all required skills.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Roadmap */}
            <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-8 text-slate-800">
                Your AI-Generated Action Plan
              </h3>
              <div className="relative border-l-2 border-indigo-100 ml-4 space-y-10">
                {result.learning_roadmap.map((phase: any, index: number) => (
                  <div key={index} className="relative pl-8">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-indigo-600 rounded-full ring-4 ring-white"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h4 className="text-lg font-bold text-gray-900">
                        Phase {phase.phase}: {phase.focus}
                      </h4>
                      <span
                        className={`text-[10px] uppercase font-black px-2 py-1 rounded w-fit ${
                          phase.priority === "High"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {phase.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 font-medium">
                      {phase.duration_months} Months Duration
                    </p>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div className="mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Skills to Master
                        </span>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {phase.skills_to_learn.map((s: string) => (
                            <span
                              key={s}
                              className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-md text-slate-700 font-semibold shadow-sm"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 italic border-l-2 border-indigo-200 pl-3">
                        "{phase.reasoning}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default SkillsGapAnalysis;
