import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  BrainCircuit,
  Sparkles,
  MapPin,
  Briefcase,
  DollarSign,
  CheckCircle,
  Undo2,
  Loader2,
  LineChart,
  ArrowRight,
  Send,
  Bot,
  User,
  BarChart3,
  AlignLeft,
  Building2,
  Layers,
  Clock,
} from "lucide-react";
import { applyForJob, hasApplied } from "../../services/dbService";
import { MatchResult, Candidate } from "../../types";

interface CandidateDashboardProps {
  matches: MatchResult[];
  selectedMatch: MatchResult | null;
  setSelectedMatch: (match: MatchResult) => void;
  activeCandidate: Candidate;
}

const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  matches,
  selectedMatch,
  setSelectedMatch,
  activeCandidate,
}) => {
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // --- CHATBOT STATE ---
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      id: 1,
      sender: "ai",
      text: "Hi! I'm Sam, your Career AI. Ask me about this job's salary, skills, or location!",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  // Reset chat when job changes
  useEffect(() => {
    if (selectedMatch) {
      setChatHistory([
        {
          id: 1,
          sender: "ai",
          text: `I've analyzed the ${
            selectedMatch.job_details?.title
          } role at ${
            selectedMatch.job_details?.company
          }. Match Score: ${Math.round(
            selectedMatch.match_score
          )}%. What would you like to know?`,
        },
      ]);
    }
  }, [selectedMatch]);

  // --- LOGICAL CHATBOT FUNCTION ---
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedMatch) return;

    const userMsg = { id: Date.now(), text: chatInput, sender: "user" };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          job: selectedMatch.job_details,
          candidate: activeCandidate,
          match_data: {
            match_score: Math.round(selectedMatch.match_score),
            missing_skills: selectedMatch.missing_skills,
          },
        }),
      });
      const data = await response.json();
      setChatHistory((prev) => [
        ...prev,
        { id: Date.now() + 1, text: data.text, sender: "ai" },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Sam AI is offline. Check your Python terminal.",
          sender: "ai",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- APPLICATION LOGIC ---
  const handleToggleApply = async () => {
    if (!selectedMatch) return;
    const jobId = selectedMatch.job_id || selectedMatch.job_details?.job_id;
    if (!jobId) return;

    try {
      setApplying(true);
      if (applied) {
        setApplied(false);
        setAppliedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        const res = await applyForJob(jobId, activeCandidate);
        if (res && (res.success || res.alreadyApplied)) {
          setApplied(true);
          setAppliedJobIds((prev) => new Set(prev).add(jobId));
        }
      }
    } catch (err) {
      console.error("Toggle error", err);
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    const jobId = selectedMatch?.job_id || selectedMatch?.job_details?.job_id;
    if (jobId) setApplied(appliedJobIds.has(jobId));
  }, [selectedMatch, appliedJobIds]);

  return (
    <div className="grid lg:grid-cols-12 gap-8 font-sans">
      {/* LEFT SIDEBAR: VACANCIES */}
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 shadow-emerald-100 shadow-lg">
              <Zap size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Best Matches
            </h2>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {matches.map((m) => {
              const mJobId = m.job_id || m.job_details?.job_id;
              const isSelected = selectedMatch?.job_id === m.job_id;
              const isAppliedInList = appliedJobIds.has(mJobId || "");

              const jobLoc = m.job_details?.location || "Remote";
              const isLocationMatch = activeCandidate.preferred_locations.some(
                (pref) => jobLoc.toLowerCase().includes(pref.toLowerCase())
              );

              return (
                <div key={mJobId} className="relative group perspective-1000">
                  <button
                    onClick={() => setSelectedMatch(m)}
                    className={`w-full p-5 pb-12 rounded-[24px] text-left transition-all duration-300 relative border-2 ${
                      isSelected
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-200 scale-[1.02] border-transparent"
                        : isAppliedInList
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-white text-slate-600 hover:bg-slate-50 border-transparent shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-black text-lg leading-tight flex items-center gap-2">
                        {m.job_details?.title}
                        {isAppliedInList && (
                          <CheckCircle
                            size={16}
                            className={
                              isSelected ? "text-white" : "text-emerald-500"
                            }
                          />
                        )}
                      </div>
                      <div
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                          isSelected
                            ? "bg-white/20 text-white backdrop-blur-sm"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {Math.round(m.match_score)}%
                      </div>
                    </div>
                    <div
                      className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                        isSelected ? "text-indigo-100" : "text-slate-400"
                      }`}
                    >
                      <MapPin
                        size={10}
                        className={
                          isLocationMatch
                            ? isSelected
                              ? "text-white"
                              : "text-emerald-500"
                            : ""
                        }
                      />
                      {m.job_details?.company} • {m.job_details?.location}
                    </div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (m.job_details) {
                        navigate("/analysis", {
                          state: {
                            candidate: activeCandidate,
                            job: m.job_details,
                          },
                        });
                      }
                    }}
                    className={`absolute right-3 bottom-3 py-1.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all z-20 shadow-sm hover:shadow-md
                        ${
                          isSelected
                            ? "bg-white text-indigo-700 hover:bg-indigo-50"
                            : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100"
                        }`}
                  >
                    <BarChart3 size={12} /> Gap Analysis
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* RIGHT SIDE: CONTENT & CHAT */}
      <div className="lg:col-span-8 space-y-6">
        {selectedMatch ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* ▼▼▼ JOB DETAILS CARD ▼▼▼ */}
            {selectedMatch.job_details && (
              <div className="bg-white rounded-[40px] border border-slate-100 p-8 md:p-10 shadow-2xl shadow-indigo-100/50 space-y-8 relative overflow-hidden group">
                {/* Header Section */}
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                      <Sparkles size={12} className="animate-pulse" /> Top
                      Recommendation
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                      {selectedMatch.job_details.title}
                    </h2>
                    <div className="text-xl font-bold text-slate-500 flex items-center gap-2">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <Building2 size={20} className="text-indigo-600" />
                      </div>
                      {selectedMatch.job_details.company}
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div className="relative group/score cursor-help">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover/score:opacity-30 transition-opacity rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-violet-600 to-indigo-600 text-white w-28 h-28 rounded-[32px] rotate-3 hover:rotate-0 transition-all duration-300 flex flex-col items-center justify-center shadow-xl shadow-indigo-200 border-4 border-white">
                      <span className="text-3xl font-black tracking-tighter">
                        {Math.round(selectedMatch.match_score)}%
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">
                        Match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Grid - COLOR CODED */}
                <div className="relative z-10 grid md:grid-cols-3 gap-4">
                  <DetailBox
                    icon={<MapPin size={18} />}
                    label="Location"
                    value={
                      selectedMatch.job_details.location ||
                      "Remote / Negotiable"
                    }
                    delay={100}
                    color="bg-violet-50 border-violet-100 text-violet-700"
                  />
                  <DetailBox
                    icon={<Clock size={18} />}
                    label="Experience"
                    value={
                      selectedMatch.job_details.experience_required ||
                      "Freshers Welcome"
                    }
                    delay={200}
                    color="bg-amber-50 border-amber-100 text-amber-700"
                  />
                  <DetailBox
                    icon={<DollarSign size={18} />}
                    label="Salary Range"
                    value={
                      selectedMatch.job_details.salary_range &&
                      selectedMatch.job_details.salary_range[1] > 0
                        ? `$${selectedMatch.job_details.salary_range[0].toLocaleString()} - $${selectedMatch.job_details.salary_range[1].toLocaleString()}`
                        : "Competitive / Negotiable"
                    }
                    delay={300}
                    color="bg-emerald-50 border-emerald-100 text-emerald-700"
                  />
                </div>

                {/* Job Description & Skills Section */}
                <div className="grid md:grid-cols-3 gap-6 relative z-10">
                  {/* Left: Description */}
                  <div className="md:col-span-2 bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlignLeft size={16} className="text-indigo-500" /> Role
                      Overview
                    </h3>
                    <div className="text-slate-600 text-sm leading-relaxed font-medium">
                      {(selectedMatch.job_details as any).description ? (
                        (selectedMatch.job_details as any).description
                      ) : (
                        <p className="italic opacity-80">
                          We are looking for a talented{" "}
                          <strong>{selectedMatch.job_details.title}</strong> to
                          join our team at{" "}
                          <strong>{selectedMatch.job_details.company}</strong>.
                          This role involves working with modern technologies
                          and requires specific skills in our tech stack.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Skills Tags */}
                  <div className="md:col-span-1 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Layers size={16} className="text-indigo-500" /> Required
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2 content-start">
                      {selectedMatch.job_details.required_skills?.map(
                        (skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Apply Button - BLUE */}
                <div className="relative z-10 pt-4">
                  <button
                    onClick={handleToggleApply}
                    disabled={applying}
                    className={`w-full py-6 rounded-[28px] font-black text-xl shadow-xl hover:shadow-2xl hover:shadow-blue-200 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 relative overflow-hidden group/btn
                    ${
                      applied
                        ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {!applied && (
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12"></div>
                    )}

                    {applying ? (
                      <Loader2 className="animate-spin" />
                    ) : applied ? (
                      <>
                        {" "}
                        <Undo2 size={20} /> Withdraw Application{" "}
                      </>
                    ) : (
                      <>
                        {" "}
                        <Send size={20} /> Apply Now{" "}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* CHATBOT */}
            <div className="bg-white rounded-[32px] border border-slate-200 flex flex-col shadow-sm overflow-hidden h-[400px]">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider leading-none">
                    Sam AI
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Assistant Online
                  </span>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-white">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    } animate-in fade-in slide-in-from-bottom-2`}
                  >
                    <div
                      className={`flex gap-3 max-w-[85%] ${
                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                          msg.sender === "user"
                            ? "bg-slate-900"
                            : "bg-indigo-600"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          <User size={14} className="text-white" />
                        ) : (
                          <Bot size={14} className="text-white" />
                        )}
                      </div>
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                          msg.sender === "user"
                            ? "bg-slate-900 text-white rounded-tr-sm border-slate-900"
                            : "bg-indigo-50 border-indigo-100 text-indigo-900 rounded-tl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs ml-14 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animation-delay-200"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animation-delay-400"></span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask Sam about salary, skills..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 shadow-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isTyping}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border-dashed border-2 border-slate-200 p-24 text-center flex flex-col items-center justify-center h-[500px]">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300 shadow-inner">
              <Briefcase size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">
              No Job Selected
            </h3>
            <p className="text-slate-400 font-bold max-w-xs mx-auto">
              Select a job opportunity from the left sidebar to view full
              details and analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-components with animation delay and custom colors
const DetailBox = ({
  icon,
  label,
  value,
  delay,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  delay: number;
  color: string;
}) => (
  <div
    className={`p-6 rounded-[24px] border shadow-sm hover:shadow-md transition-shadow group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards ${color}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 opacity-70">
      {icon} {label}
    </div>
    <div className="font-bold text-sm md:text-base leading-tight">{value}</div>
  </div>
);

export default CandidateDashboard;
