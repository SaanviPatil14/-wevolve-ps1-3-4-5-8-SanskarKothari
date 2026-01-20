import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Brain, 
  X,
  Trash2,
  Calendar,
  UserMinus,
  Search,
  Sparkles,
  CheckCircle2,
  Star,
  CircleSlash,
  Lock // <--- ADDED: Lock Icon for access denied screen
} from "lucide-react";
import { MatchResult, Job } from "../../types";
import CandidateProfile from "./CandidateProfile";
import JobDescriptionGenerator from "./JobDescriptionGenerator";
import {
  fetchEmployerApplications,
  deleteJobFromFirestore,
  updateApplicationStatus,
  scheduleInterview
} from "../../services/dbService";
import { auth } from "../../firebase";

interface EmployerDashboardProps {
  jobs: Job[];
  selectedJob: Job | null;
  setSelectedJob: (job: Job) => void;
  matches: MatchResult[];
  selectedMatch: MatchResult | null;
  setSelectedMatch: (match: MatchResult) => void;
  isJobModalOpen: boolean;
  setIsJobModalOpen: (open: boolean) => void;
  newJob: Partial<Job>;
  setNewJob: (job: Partial<Job>) => void;
  handleCreateJob: () => void;
  isAiExplaining: boolean;
  aiExplanation: string;
}

const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  jobs,
  selectedJob,
  setSelectedJob,
  matches,
  selectedMatch,
  setSelectedMatch,
  isJobModalOpen,
  setIsJobModalOpen,
  newJob,
  setNewJob,
  handleCreateJob,
  isAiExplaining,
  aiExplanation,
}) => {
  // --- ADDED: AUTHORIZATION LOGIC START ---
  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || "";

  // List of allowed emails (Whitelisted Admins)
  const ALLOWED_EMAILS = [
    "saanvipatil2006@gmail.com",
    "sanskarkthr@gmail.com",
    "darshanj495@gmail.com"
  ];

  // If the user's email is NOT in the allowed list, show Access Denied
  if (!ALLOWED_EMAILS.includes(userEmail)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Lock size={48} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Access Restricted</h2>
        <p className="text-slate-500 max-w-md text-lg mb-8">
          This dashboard is limited to authorized administrators only. 
          You are currently logged in as <span className="font-bold text-slate-900">{userEmail}</span>.
        </p>
        <button 
          onClick={() => auth.signOut()}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          Sign Out
        </button>
      </div>
    );
  }
  // --- ADDED: AUTHORIZATION LOGIC END ---

  const [showGenerator, setShowGenerator] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({
    date: '',
    time: '',
    location: '',
    type: 'video',
    notes: ''
  });
  const [schedulingApplicantId, setSchedulingApplicantId] = useState<string | null>(null);

  // Fetch employer applications
  React.useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.log("No uid found for employer applications fetch");
      return;
    }
    let mounted = true;
    console.log("Fetching applications for employer:", uid);
    fetchEmployerApplications(uid)
      .then((res) => {
        if (!mounted) return;
        console.log("Applications loaded:", res);
        setApplications(res || []);
      })
      .catch((err) => console.error("Error loading applications", err));
    return () => {
      mounted = false;
    };
  }, [selectedJob, jobs]);

  // --- HANDLERS ---

  const handleStatusChange = async (appId: string, status: string) => {
    try {
      await updateApplicationStatus(appId, status);
      setApplications((prev) =>
        prev.map((a) =>
          a.application_id === appId ? { ...a, status: status } : a
        )
      );
      if (selectedApplicant && selectedApplicant.application_id === appId) {
        setSelectedApplicant({ ...selectedApplicant, status: status });
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const handleRejectCandidate = async (appId: string) => {
    if (!window.confirm("Are you sure you want to reject this candidate? They will not be able to re-apply for this specific role.")) return;
    try {
      await updateApplicationStatus(appId, 'rejected');
      setApplications((prev) =>
        prev.map((a) => a.application_id === appId ? { ...a, status: 'rejected' } : a)
      );
      if (selectedApplicant && selectedApplicant.application_id === appId) {
        setSelectedApplicant({ ...selectedApplicant, status: 'rejected' });
      }
    } catch (err) {
      alert("Failed to reject candidate.");
    }
  };

  const handleScheduleInterview = async (appId: string) => {
    setSchedulingApplicantId(appId);
    setShowInterviewModal(true);
  };

  const handleSubmitInterview = async () => {
    if (!schedulingApplicantId || !interviewData.date || !interviewData.time || !interviewData.location) {
      alert("Please fill in all interview details");
      return;
    }
    
    try {
      const success = await scheduleInterview(schedulingApplicantId, interviewData);
      if (success) {
        // Update application status in UI
        setApplications((prev) =>
          prev.map((a) =>
            a.application_id === schedulingApplicantId 
              ? { 
                  ...a, 
                  status: 'interview_scheduled',
                  interview_date: interviewData.date,
                  interview_time: interviewData.time,
                  interview_location: interviewData.location,
                  interview_type: interviewData.type
                } 
              : a
          )
        );
        if (selectedApplicant && selectedApplicant.application_id === schedulingApplicantId) {
          setSelectedApplicant({ 
            ...selectedApplicant, 
            status: 'interview_scheduled',
            interview_date: interviewData.date,
            interview_time: interviewData.time,
            interview_location: interviewData.location,
            interview_type: interviewData.type
          });
        }
        setShowInterviewModal(false);
        setInterviewData({ date: '', time: '', location: '', type: 'video', notes: '' });
        setSchedulingApplicantId(null);
        alert("Interview scheduled successfully!");
      }
    } catch (err) {
      console.error("Failed to schedule interview:", err);
      alert("Failed to schedule interview.");
    }
  };

  const handleDeleteJob = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!window.confirm("CRITICAL: Delete vacancy and all applications permanently?")) return;
    try {
      await deleteJobFromFirestore(jobId);
      window.location.reload();
    } catch (err) {
      alert("Failed to delete the vacancy.");
    }
  };

  // Logic for the "Publish Immediately" button inside the AI Generator
  const handleAiPublish = async (generatedText: string) => {
    // We update a local object first because React state updates (setNewJob) 
    // are asynchronous and might not be ready when handleCreateJob is called.
    const updatedJob = { ...newJob, description: generatedText };
    setNewJob(updatedJob);
    
    // Use a small timeout to ensure state update is processed or 
    // ideally handleCreateJob should be refactored to accept a job object.
    setTimeout(() => {
      handleCreateJob();
      setShowGenerator(false);
    }, 150);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Left Sidebar - Vacancy List */}
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 overflow-hidden relative">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600">
                <Briefcase size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vacancies</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsJobModalOpen(true)} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                <Plus size={20} />
              </button>
              <button onClick={() => setShowGenerator(true)} className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-slate-50 transition-all border border-slate-100 font-bold text-[10px]">JD GEN</button>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {jobs.map((job) => (
              <div key={job.job_id} className="group relative">
                <button onClick={() => setSelectedJob(job)} className={`w-full p-5 rounded-3xl text-left transition-all border-2 ${selectedJob?.job_id === job.job_id ? "bg-indigo-600 text-white border-indigo-600 shadow-xl scale-[1.02]" : "bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100"}`}>
                  <div className="font-black text-lg leading-none mb-2 pr-8">{job.title}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${selectedJob?.job_id === job.job_id ? "text-indigo-100" : "text-slate-400"}`}>{job.location} • {(job as any).deadline ? `Ends: ${(job as any).deadline}` : "Open Ended"}</div>
                </button>
                <button onClick={(e) => handleDeleteJob(e, job.job_id)} className={`absolute top-5 right-4 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${selectedJob?.job_id === job.job_id ? "text-white/60 hover:text-white hover:bg-white/10" : "text-slate-300 hover:text-red-500 hover:bg-red-50"}`}><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-8 space-y-6">
        <div className="rounded-[32px] p-10 text-white shadow-2xl overflow-hidden relative transition-all duration-700 bg-indigo-600">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 opacity-70">
              <Brain size={24} />
              <div className="text-xs font-black uppercase tracking-[0.2em]">Hiring Intelligence: {selectedJob ? selectedJob.title : "Vacant"}</div>
            </div>
            <h2 className="text-4xl font-black mb-2">{selectedJob ? `${applications.filter((a) => a.job_id === selectedJob.job_id).length} Candidates Applied` : "Pipeline Overview"}</h2>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full translate-x-20 -translate-y-20"></div>
        </div>

        {/* Pipeline List */}
        <section className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm min-h-[400px]">
          <h3 className="font-black text-xl text-slate-900 uppercase flex items-center gap-2 mb-8"><Search size={20} className="text-indigo-600" /> Pipeline</h3>
          <div className="space-y-4">
            {selectedJob ? (
              applications.filter((a) => a.job_id === selectedJob.job_id).map((app) => (
                <div key={app.application_id} className={`p-6 rounded-[28px] border flex items-center justify-between transition-all group ${
                  app.status === 'rejected' 
                  ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                  : app.status === 'shortlisted'
                  ? 'bg-emerald-50/50 border-emerald-100 hover:bg-white hover:shadow-xl'
                  : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-xl'
                }`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="font-black text-slate-900 text-lg">{app.candidate_name || "Applicant"}</div>
                      {app.status === 'reviewed' && <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Reviewed</span>}
                      {app.status === 'shortlisted' && <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter flex items-center gap-0.5"><Star size={8} fill="currentColor" /> Shortlisted</span>}
                      {app.status === 'interview_scheduled' && <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter flex items-center gap-0.5"><Calendar size={8} /> Interview Scheduled</span>}
                      {app.status === 'rejected' && <span className="bg-red-100 text-red-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter flex items-center gap-0.5"><CircleSlash size={8} /> Rejected</span>}
                    </div>
                    <div className="text-xs text-slate-400 font-bold uppercase">{new Date(app.applied_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedApplicant({ ...app.candidate_profile, application_id: app.application_id, status: app.status })} className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-black text-xs border border-slate-100 hover:bg-indigo-50">VIEW PROFILE</button>
                    {app.status === 'shortlisted' && (
                      <button onClick={() => handleScheduleInterview(app.application_id)} className="px-6 py-2 bg-blue-100 text-blue-600 rounded-xl font-black text-xs border border-blue-200 hover:bg-blue-200 transition-all flex items-center gap-1"><Calendar size={14} /> Schedule</button>
                    )}
                    {app.status !== 'rejected' && app.status !== 'interview_scheduled' && (
                      <button onClick={() => handleRejectCandidate(app.application_id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><UserMinus size={20} /></button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 font-bold">Select a vacancy to manage pipeline.</div>
            )}
          </div>
        </section>
      </div>

      {/* --- MODALS SECTION --- */}

      {/* 1. ADD VACANCY MODAL */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsJobModalOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative z-10 p-12 border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-black text-slate-900 mb-2">New Vacancy</h2>
              <button onClick={() => setIsJobModalOpen(false)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all"><X size={24} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Job Title</label>
                  <input type="text" placeholder="e.g. Lead Dev" className="w-full px-6 py-5 bg-slate-50 rounded-3xl outline-none font-bold" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Location</label>
                  <select className="w-full px-6 py-5 bg-slate-50 rounded-3xl outline-none font-bold" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}>
                    <option>Remote</option><option>Bangalore</option><option>Hyderabad</option><option>Rourkela</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Min Salary (Annual)</label>
                  <input type="number" placeholder="8,00,000" className="w-full px-6 py-5 bg-slate-50 rounded-3xl outline-none font-bold" value={newJob.salary_range ? newJob.salary_range[0] : ""} onChange={(e) => setNewJob({ ...newJob, salary_range: [parseInt(e.target.value) || 0, newJob.salary_range?.[1] || 0] })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Max Salary (Annual)</label>
                  <input type="number" placeholder="15,00,000" className="w-full px-6 py-5 bg-slate-50 rounded-3xl outline-none font-bold" value={newJob.salary_range ? newJob.salary_range[1] : ""} onChange={(e) => setNewJob({ ...newJob, salary_range: [newJob.salary_range?.[0] || 0, parseInt(e.target.value) || 0] })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Application Deadline</label>
                <input type="date" className="w-full px-6 py-5 bg-slate-50 rounded-3xl outline-none font-bold" value={(newJob as any).deadline || ""} onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value } as any)} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Required Skills (Comma separated)</label>
                <input type="text" placeholder="React, Node, Firebase" className="w-full px-6 py-5 bg-slate-50 rounded-3xl outline-none font-bold" value={newJob.required_skills?.join(", ") || ""} onChange={(e) => setNewJob({ ...newJob, required_skills: e.target.value.split(",").map(s => s.trim()) })} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center pr-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Job Description</label>
                  <button onClick={() => { setIsJobModalOpen(false); setShowGenerator(true); }} className="text-[10px] font-black text-indigo-600 flex items-center gap-1 hover:underline"><Sparkles size={12} /> USE AI GENERATOR</button>
                </div>
                <textarea placeholder="Describe the role responsibilities..." rows={5} className="w-full px-6 py-5 bg-slate-50 rounded-3xl outline-none font-bold resize-none" value={newJob.description || ""} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} />
              </div>

              <button onClick={handleCreateJob} className="w-full py-7 bg-indigo-600 text-white rounded-[32px] font-black text-xl hover:bg-indigo-700 transition-all uppercase tracking-widest shadow-xl shadow-indigo-100">Publish Vacancy</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI GENERATOR MODAL */}
      {showGenerator && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowGenerator(false)}></div>
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative z-10 p-10 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Sparkles className="text-indigo-600" /> AI Description Generator</h3>
              <button onClick={() => setShowGenerator(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-red-50 transition-all"><X size={20} /></button>
            </div>

            <JobDescriptionGenerator 
              onClose={() => setShowGenerator(false)} 
              salaryRange={newJob.salary_range || [0, 0]}
              setSalaryRange={(range: [number, number]) => setNewJob({ ...newJob, salary_range: range })}
              onUseDescription={(aiText) => {
                setNewJob({ ...newJob, description: aiText });
                setShowGenerator(false);
                setIsJobModalOpen(true); 
              }} 
              onPublish={handleAiPublish}
            />
          </div>
        </div>
      )}

      {/* 3. CANDIDATE DEEP DIVE MODAL */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedApplicant(null)}></div>
          <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${selectedApplicant.status === 'rejected' ? 'bg-red-500' : selectedApplicant.status === 'shortlisted' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Applicant Deep Dive</span>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-10 custom-scrollbar bg-slate-50/20 flex-1">
              <CandidateProfile candidate={selectedApplicant} />
            </div>
            <div className="p-8 bg-white border-t border-slate-50 flex gap-4">
              {selectedApplicant.status === 'rejected' ? (
                <div className="w-full py-5 bg-red-50 text-red-600 rounded-[24px] font-black text-center text-lg uppercase border border-red-100 tracking-widest">Application Permanently Rejected</div>
              ) : selectedApplicant.status === 'interview_scheduled' ? (
                <div className="w-full py-5 bg-blue-50 text-blue-600 rounded-[24px] font-black text-center text-lg uppercase border border-blue-100 tracking-widest">Interview Already Scheduled</div>
              ) : (
                <>
                  <button onClick={() => handleStatusChange(selectedApplicant.application_id, 'shortlisted')} className={`flex-1 py-5 rounded-[24px] font-black text-lg transition-all ${selectedApplicant.status === 'shortlisted' ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-indigo-600 text-white shadow-indigo-100'}`}>
                    {selectedApplicant.status === 'shortlisted' ? 'SHORTLISTED' : 'SHORTLIST CANDIDATE'}
                  </button>
                  <button onClick={() => handleRejectCandidate(selectedApplicant.application_id)} className="px-10 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-black text-lg hover:bg-red-50 hover:text-red-500 transition-all">REJECT</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interview Scheduling Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowInterviewModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 p-10 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Calendar size={24} />
              </div>
              <div>
                <h2 className="font-black text-xl text-slate-900">Schedule Interview</h2>
                <p className="text-xs text-slate-400 font-bold uppercase">Plan the next step</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Interview Date</label>
                <input 
                  type="date" 
                  value={interviewData.date}
                  onChange={(e) => setInterviewData({...interviewData, date: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:border-blue-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Interview Time</label>
                <input 
                  type="time" 
                  value={interviewData.time}
                  onChange={(e) => setInterviewData({...interviewData, time: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:border-blue-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Interview Type</label>
                <select 
                  value={interviewData.type}
                  onChange={(e) => setInterviewData({...interviewData, type: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:border-blue-300"
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Location / Link</label>
                <input 
                  type="text" 
                  placeholder="Zoom link, office address, etc."
                  value={interviewData.location}
                  onChange={(e) => setInterviewData({...interviewData, location: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:border-blue-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Additional Notes</label>
                <textarea 
                  placeholder="Any instructions for the candidate..."
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({...interviewData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:border-blue-300 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowInterviewModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitInterview}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all uppercase shadow-lg shadow-blue-100"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;