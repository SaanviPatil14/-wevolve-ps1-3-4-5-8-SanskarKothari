import React, { useEffect, useState } from 'react';
import { Zap, BrainCircuit, Sparkles, MapPin, Briefcase, DollarSign, CheckCircle, Undo2, Loader2 } from 'lucide-react';
import { applyForJob, hasApplied } from '../../services/dbService';
import { MatchResult, Candidate } from '../../types';

interface CandidateDashboardProps {
  matches: MatchResult[];
  selectedMatch: MatchResult | null;
  setSelectedMatch: (match: MatchResult) => void;
  activeCandidate: Candidate;
  isAiExplaining: boolean;
  aiExplanation: string;
}

const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  matches,
  selectedMatch,
  setSelectedMatch,
  activeCandidate,
  isAiExplaining,
  aiExplanation,
}) => {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Handle Apply Logic
  const handleToggleApply = async () => {
    if (!selectedMatch) return;
    const jobId = selectedMatch.job_id || selectedMatch.job_details?.job_id;
    if (!jobId) return;

    try {
      setApplying(true);
      if (applied) {
        // Optional: Implement withdrawApplication(jobId, activeCandidate.id) in dbService
        setApplied(false);
        setAppliedJobIds(prev => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        const res = await applyForJob(jobId, activeCandidate);
        if (res && (res.success || res.alreadyApplied)) {
          setApplied(true);
          setAppliedJobIds(prev => new Set(prev).add(jobId));
        }
      }
    } catch (err) {
      console.error('Toggle error', err);
    } finally {
      setApplying(false);
    }
  };

  // Sync "applied" status when selectedMatch changes
  useEffect(() => {
    const jobId = selectedMatch?.job_id || selectedMatch?.job_details?.job_id;
    if (jobId) {
      setApplied(appliedJobIds.has(jobId));
    }
  }, [selectedMatch, appliedJobIds]);

  // Initial Check: Batch check all matches for application status
  useEffect(() => {
    let mounted = true;
    const checkAllStatuses = async () => {
      const candidateId = activeCandidate?.id;
      if (!candidateId || matches.length === 0) return;
      
      const newAppliedSet = new Set<string>();
      
      // Perform checks in parallel for better performance
      await Promise.all(matches.map(async (m) => {
        const mId = m.job_id || m.job_details?.job_id;
        if (mId) {
          const isMApplied = await hasApplied(mId, candidateId);
          if (isMApplied) newAppliedSet.add(mId);
        }
      }));

      if (mounted) {
        setAppliedJobIds(newAppliedSet);
      }
    };

    checkAllStatuses();
    return () => { mounted = false; };
  }, [activeCandidate?.id, matches.length]); // Only re-run if candidate or match list count changes

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Left Sidebar - Matches List */}
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
              <Zap size={20}/>
            </div>
            <h2 className="text-xl font-black text-slate-900">Best Matches</h2>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {matches.map(m => {
              const mJobId = m.job_id || m.job_details?.job_id;
              const isSelected = selectedMatch?.job_id === m.job_id;
              const isAppliedInList = appliedJobIds.has(mJobId || '');

              return (
                <button 
                  key={mJobId} 
                  onClick={() => setSelectedMatch(m)} 
                  className={`w-full p-5 rounded-3xl text-left transition-all relative border-2 ${
                    isSelected 
                      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100 scale-[1.02] border-emerald-600' 
                      : isAppliedInList 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-transparent shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-black text-lg leading-none flex items-center gap-2">
                      {m.job_details?.title}
                      {isAppliedInList && <CheckCircle size={14} className={isSelected ? "text-white" : "text-emerald-500"} />}
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {Math.round(m.match_score)}%
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${
                    isSelected ? 'text-emerald-100' : 'text-slate-400'
                  }`}>
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
              <div className="text-xs font-black tracking-widest uppercase opacity-70 mb-1">Career Intelligence</div>
              <h2 className="text-3xl font-black">AI-Powered Job Analysis</h2>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-10 -translate-y-10"></div>
        </div>

        {selectedMatch ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* AI Explanation Box */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
               <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                 <Sparkles size={16}/> Gemini Synthesis
               </h3>
               {isAiExplaining ? (
                 <div className="space-y-3">
                   <div className="h-4 bg-white/5 rounded-full w-full animate-pulse"></div>
                   <div className="h-4 bg-white/5 rounded-full w-4/5 animate-pulse"></div>
                 </div>
               ) : (
                 <p className="text-lg font-medium text-slate-200 leading-relaxed italic border-l-4 border-indigo-500 pl-6">
                   "{aiExplanation}"
                 </p>
               )}
            </div>

            {/* Job Details Card */}
            {selectedMatch.job_details && (
              <div className="bg-white rounded-[32px] border border-slate-100 p-10 shadow-sm space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 mb-2">{selectedMatch.job_details.title}</h2>
                    <div className="text-xl font-bold text-indigo-600">{selectedMatch.job_details.company}</div>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-[24px] font-black text-2xl">
                    {Math.round(selectedMatch.match_score)}%
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <DetailBox icon={<MapPin size={14}/>} label="Location" value={selectedMatch.job_details.location} />
                  <DetailBox icon={<Briefcase size={14}/>} label="Experience" value={selectedMatch.job_details.experience_required} />
                  <DetailBox icon={<DollarSign size={14}/>} label="Salary" value={`$${selectedMatch.job_details.salary_range[0].toLocaleString()} - $${selectedMatch.job_details.salary_range[1].toLocaleString()}`} />
                </div>

                <button 
                  onClick={handleToggleApply} 
                  disabled={applying} 
                  className={`w-full py-6 rounded-[24px] font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                    applied 
                      ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600' 
                      : 'bg-emerald-600 text-white shadow-emerald-100 hover:scale-[1.01]'
                  }`}
                >
                  {applying ? <Loader2 className="animate-spin" /> : applied ? <><Undo2 size={20} /> Withdraw Application</> : 'Apply Now'}
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

// Sub-components for cleaner code
const DetailBox = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
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
    <p className="text-slate-400 font-bold">Select a job opportunity to view details</p>
  </div>
);

export default CandidateDashboard;