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
  Send, // <--- ADDED
  Bot, // <--- ADDED
  User, // <--- ADDED
} from "lucide-react";
import { applyForJob, hasApplied } from "../../services/dbService";
import { MatchResult, Candidate } from "../../types";

interface CandidateDashboardProps {
  matches: MatchResult[];
  selectedMatch: MatchResult | null;
  setSelectedMatch: (match: MatchResult) => void;
  activeCandidate: Candidate;
  isAiExplaining: boolean;
  aiExplanation: string;
}

interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "ai";
}

const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  matches,
  selectedMatch,
  setSelectedMatch,
  activeCandidate,
  isAiExplaining,
  aiExplanation, // We can use this as the initial context if needed
}) => {
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // --- CHATBOT STATE ---
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "ai",
      text: "Hi! I'm your Career AI. Ask me anything about this job or how your skills match!",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  // Reset chat when selecting a new job
  useEffect(() => {
    if (selectedMatch) {
      setChatHistory([
        {
          id: 1,
          sender: "ai",
          text: `I've analyzed the ${selectedMatch.job_details?.title} role at ${selectedMatch.job_details?.company}. What would you like to know?`,
        },
      ]);
    }
  }, [selectedMatch]);

  // Handle Sending Messages
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      text: chatInput,
      sender: "user",
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    // Simulate AI Response (Replace with real API call later)
    setTimeout(() => {
      let responseText =
        "That's a great question. Based on the job description, this seems like a strong fit for your backend skills.";

      // Simple Keyword Logic for Demo
      const lowerInput = userMsg.text.toLowerCase();
      if (lowerInput.includes("salary"))
        responseText = `The salary range is $${selectedMatch?.job_details?.salary_range[0].toLocaleString()} - $${selectedMatch?.job_details?.salary_range[1].toLocaleString()}. It fits your expectation of $${activeCandidate.expected_salary.toLocaleString()}.`;
      if (lowerInput.includes("skill") || lowerInput.includes("missing"))
        responseText = `You are matching ${Math.round(
          selectedMatch?.match_score || 0
        )}% of skills. You might want to brush up on: ${
          selectedMatch?.missing_skills.join(", ") || "None!"
        }`;
      if (lowerInput.includes("location"))
        responseText = `This job is located in ${selectedMatch?.job_details?.location}.`;

      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: "ai",
      };
      setChatHistory((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };
  // ---------------------

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
    if (jobId) {
      setApplied(appliedJobIds.has(jobId));
    }
  }, [selectedMatch, appliedJobIds]);

  useEffect(() => {
    let mounted = true;
    const checkAllStatuses = async () => {
      const candidateId = activeCandidate?.id;
      if (!candidateId || matches.length === 0) return;

      const newAppliedSet = new Set<string>();
      await Promise.all(
        matches.map(async (m) => {
          const mId = m.job_id || m.job_details?.job_id;
          if (mId) {
            const isMApplied = await hasApplied(mId, candidateId);
            if (isMApplied) newAppliedSet.add(mId);
          }
        })
      );

      if (mounted) {
        setAppliedJobIds(newAppliedSet);
      }
    };

    checkAllStatuses();
    return () => {
      mounted = false;
    };
  }, [activeCandidate?.id, matches.length]);

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Left Sidebar - Matches List */}
      <div className="lg:col-span-4 space-y-6">
        {/* Skills Gap Analysis Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <LineChart className="w-6 h-6 text-white" />
              </div>
              <span className="bg-white/20 text-[10px] font-bold py-1 px-3 rounded-full border border-white/10 uppercase tracking-wider">
                New
              </span>
            </div>

            <h3 className="text-xl font-black mb-2">Skills Gap Engine</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-90">
              Analyze your current skills against target roles to generate a
              personalized learning roadmap.
            </p>

            <button
              onClick={() => navigate("/analysis")}
              className="w-full py-3 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Analyze Profile <ArrowRight size={18} />
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
          <div className="absolute top-10 right-10 w-4 h-4 bg-yellow-400 rounded-full blur-sm animate-pulse"></div>
        </div>

        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
              <Zap size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Best Matches</h2>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {matches.map((m) => {
              const mJobId = m.job_id || m.job_details?.job_id;
              const isSelected = selectedMatch?.job_id === m.job_id;
              const isAppliedInList = appliedJobIds.has(mJobId || "");

              return (
                <button
                  key={mJobId}
                  onClick={() => setSelectedMatch(m)}
                  className={`w-full p-5 rounded-3xl text-left transition-all relative border-2 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100 scale-[1.02] border-emerald-600"
                      : isAppliedInList
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-600 hover:bg-slate-50 border-transparent shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-black text-lg leading-none flex items-center gap-2">
                      {m.job_details?.title}
                      {isAppliedInList && (
                        <CheckCircle
                          size={14}
                          className={
                            isSelected ? "text-white" : "text-emerald-500"
                          }
                        />
                      )}
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {Math.round(m.match_score)}%
                    </div>
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      isSelected ? "text-emerald-100" : "text-slate-400"
                    }`}
                  >
                    {m.job_details?.company} • {m.job_details?.location}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-8 space-y-6">
        {/* Hero Section */}
        <div className="rounded-[32px] p-10 text-white shadow-2xl overflow-hidden relative bg-emerald-600">
          <div className="relative z-10 flex items-center gap-4">
            <BrainCircuit size={40} className="animate-pulse" />
            <div>
              <div className="text-xs font-black tracking-widest uppercase opacity-70 mb-1">
                Career Intelligence
              </div>
              <h2 className="text-3xl font-black">AI-Powered Job Analysis</h2>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-10 -translate-y-10"></div>
        </div>

        {selectedMatch ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* ▼▼▼ CHANGED: REPLACED STATIC BOX WITH CHATBOT ▼▼▼ */}
            <div className="bg-slate-900 rounded-[32px] flex flex-col shadow-2xl overflow-hidden h-[400px]">
              {/* Chat Header */}
              <div className="p-4 bg-slate-800/50 border-b border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Gemini Job Assistant
                </h3>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-900">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                          msg.sender === "user"
                            ? "bg-slate-700"
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
                        className={`p-3 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-slate-700 text-white rounded-tr-none"
                            : "bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center">
                        <Bot size={14} className="text-white" />
                      </div>
                      <div className="bg-indigo-600/20 border border-indigo-500/30 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center h-10">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Area */}
              <div className="p-4 bg-slate-800/80 border-t border-white/5 backdrop-blur-sm">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask about salary, skills, or culture..."
                    className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
            {/* ▲▲▲ END CHATBOT SECTION ▲▲▲ */}

            {/* Job Details Card */}
            {selectedMatch.job_details && (
              <div className="bg-white rounded-[32px] border border-slate-100 p-10 shadow-sm space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 mb-2">
                      {selectedMatch.job_details.title}
                    </h2>
                    <div className="text-xl font-bold text-indigo-600">
                      {selectedMatch.job_details.company}
                    </div>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-[24px] font-black text-2xl">
                    {Math.round(selectedMatch.match_score)}%
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <DetailBox
                    icon={<MapPin size={14} />}
                    label="Location"
                    value={selectedMatch.job_details.location}
                  />
                  <DetailBox
                    icon={<Briefcase size={14} />}
                    label="Experience"
                    value={selectedMatch.job_details.experience_required}
                  />
                  <DetailBox
                    icon={<DollarSign size={14} />}
                    label="Salary"
                    value={`$${selectedMatch.job_details.salary_range[0].toLocaleString()} - $${selectedMatch.job_details.salary_range[1].toLocaleString()}`}
                  />
                </div>

                <button
                  onClick={handleToggleApply}
                  disabled={applying}
                  className={`w-full py-6 rounded-[24px] font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                    applied
                      ? "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      : "bg-emerald-600 text-white shadow-emerald-100 hover:scale-[1.01]"
                  }`}
                >
                  {applying ? (
                    <Loader2 className="animate-spin" />
                  ) : applied ? (
                    <>
                      <Undo2 size={20} /> Withdraw Application
                    </>
                  ) : (
                    "Apply Now"
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

// Sub-components
const DetailBox = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="p-6 bg-slate-50 rounded-[24px]">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
      {icon} {label}
    </div>
    <div className="font-bold text-slate-900">{value}</div>
  </div>
);

const EmptyState = () => (
  <div className="bg-white rounded-[32px] border-dashed border-2 border-slate-200 p-24 text-center flex flex-col items-center justify-center">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
      <Briefcase size={24} />
    </div>
    <p className="text-slate-400 font-bold">
      Select a job opportunity to view details
    </p>
  </div>
);

export default CandidateDashboard;
