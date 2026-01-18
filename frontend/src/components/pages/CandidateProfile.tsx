import React, { useState } from 'react';
import { Camera, Mail, Phone, MapPin, Edit3, Save, Award, FileText, Target, Home, School } from 'lucide-react';
import { Candidate } from '../../types';

interface CandidateProfileProps {
  candidate: Candidate;
  editable?: boolean;
  onUpdate?: (c: Candidate) => void;
}

const CandidateProfileView: React.FC<CandidateProfileProps> = ({ candidate, editable, onUpdate }) => {
  const [localCandidate, setLocalCandidate] = useState(candidate);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Helper to extract "City, State" from a full address string
  const getShortAddress = (address: string) => {
    if (!address) return "No address added";
    const parts = address.split(',').map(p => p.trim());
    // Logic: If there are multiple parts, take the last two (City, State) 
    // or just the last one if it's short.
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    }
    return address;
  };

  const handleSave = () => {
    if (onUpdate) onUpdate(localCandidate);
    setIsEditMode(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 flex-shrink-0 rounded-[32px] bg-indigo-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
              {(candidate as any).photoURL ? (
                <img src={(candidate as any).photoURL} alt={candidate.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-indigo-600 font-black text-4xl">
                  {candidate.name ? candidate.name.charAt(0) : ''}
                </div>
              )}
            </div>
            {editable && (
              <button className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 opacity-0 group-hover:opacity-100 transition-all">
                <Camera size={18} />
              </button>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-black text-slate-900 leading-none mb-2">{candidate.name}</h2>
                <div className="flex flex-wrap gap-4 text-slate-400 font-bold text-sm">
                  <span className="flex items-center gap-1.5"><Mail size={16} /> {candidate.contact_email || 'No email'}</span>
                  <span className="flex items-center gap-1.5"><Phone size={16} /> {candidate.contact_phone || 'No phone'}</span>
                  {/* Short Form Address: City, State */}
                  <span className="flex items-center gap-1.5"><MapPin size={16} /> {getShortAddress((candidate as any).address)}</span>
                </div>
              </div>
              {editable && (
                <button 
                  onClick={() => isEditMode ? handleSave() : setIsEditMode(true)} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${isEditMode ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {isEditMode ? <><Save size={18} /> Save Profile</> : <><Edit3 size={18} /> Edit Profile</>}
                </button>
              )}
            </div>
            
            {isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="w-full p-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold md:col-span-2" placeholder="Full name" value={localCandidate.name} onChange={e => setLocalCandidate({...localCandidate, name: e.target.value})} />
                <input className="w-full p-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold md:col-span-2" placeholder="Contact email" value={localCandidate.contact_email || ''} onChange={e => setLocalCandidate({...localCandidate, contact_email: e.target.value})} />
                
                {/* Same Line: Phone and Address */}
                <input className="w-full p-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" placeholder="Contact phone" value={localCandidate.contact_phone || ''} onChange={e => setLocalCandidate({...localCandidate, contact_phone: e.target.value})} />
                <input className="w-full p-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold" placeholder="Full Address (e.g. Street, City, State)" value={(localCandidate as any).address || ''} onChange={e => setLocalCandidate({...localCandidate, address: e.target.value} as any)} />
                
                <textarea 
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold md:col-span-2" rows={3}
                  placeholder="Professional summary"
                  value={localCandidate.bio || ''}
                  onChange={e => setLocalCandidate({...localCandidate, bio: e.target.value})}
                />
              </div>
            ) : (
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-3xl">
                {candidate.bio || "No professional summary provided yet."}
              </p>
            )}
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-50 rounded-full blur-[80px] opacity-40 pointer-events-none"></div>
      </div>

      {/* Info Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Expertise Section */}
        <div className="md:col-span-2 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Award className="text-indigo-600" size={24} />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Technical Expertise</h3>
            </div>
            {isEditMode ? (
              <input 
                className="w-full p-4 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold"
                value={localCandidate.skills.join(", ")}
                onChange={e => setLocalCandidate({...localCandidate, skills: e.target.value.split(",").map(s => s.trim())})}
                placeholder="Skills (Comma separated)"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map(s => (
                  <span key={s} className="px-5 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-sm font-black border border-indigo-100/50 hover:scale-105 transition-transform cursor-default">{s}</span>
                ))}
              </div>
            )}
        </div>

        {/* Core Metrics */}
        <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">Experience</div>
                  {isEditMode ? (
                    <input className="w-full p-2 bg-slate-800 rounded-lg text-3xl font-black text-center outline-none border-none" type="number" value={localCandidate.experience_years} onChange={e => setLocalCandidate({...localCandidate, experience_years: Number(e.target.value)})} />
                  ) : (
                    <div className="text-3xl font-black">{candidate.experience_years} Years</div>
                  )}
              </div>
              <div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">Salary Expectations</div>
                  {isEditMode ? (
                    <input className="w-full p-2 bg-slate-800 rounded-lg text-3xl font-black text-center outline-none border-none" type="number" value={localCandidate.expected_salary} onChange={e => setLocalCandidate({...localCandidate, expected_salary: Number(e.target.value)})} />
                  ) : (
                    <div className="text-3xl font-black">${candidate.expected_salary.toLocaleString()}</div>
                  )}
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">Availability</div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div> Open for Opportunities</div>
            </div>
        </div>

        {/* Education Section */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="text-indigo-600" size={24} />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Education</h3>
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-2xl">
                  {isEditMode ? (
                    <div className="space-y-2">
                      <input className="w-full p-2 border rounded text-xs font-bold" value={(localCandidate.education as any).college || ''} onChange={e => setLocalCandidate({...localCandidate, education: {...localCandidate.education, college: e.target.value} as any})} placeholder="College/University Name" />
                      <input className="w-full p-2 border rounded text-xs font-bold" value={localCandidate.education.degree} onChange={e => setLocalCandidate({...localCandidate, education: {...localCandidate.education, degree: e.target.value}})} placeholder="Degree" />
                      <input className="w-full p-2 border rounded text-xs font-bold" value={localCandidate.education.field} onChange={e => setLocalCandidate({...localCandidate, education: {...localCandidate.education, field: e.target.value}})} placeholder="Field" />
                      <input className="w-full p-2 border rounded text-xs font-bold" value={String(localCandidate.education.cgpa)} onChange={e => setLocalCandidate({...localCandidate, education: {...localCandidate.education, cgpa: e.target.value}})} placeholder="GPA/CGPA" />
                    </div>
                  ) : (
                    <>
                      <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                        <School size={16} className="text-indigo-400" />
                        {(candidate.education as any).college || "University Not Specified"}
                      </div>
                      <div className="text-sm font-bold text-slate-600">{candidate.education.degree} in {candidate.education.field}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">GPA: {candidate.education.cgpa}</div>
                    </>
                  )}
              </div>
            </div>
        </div>

        {/* Role Preferences Section */}
        <div className="md:col-span-2 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Target className="text-indigo-600" size={24} />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Role Preferences</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Target Roles</div>
                  <div className="flex flex-wrap gap-2">
                    {isEditMode ? (
                      <input className="w-full p-2 border rounded text-xs font-bold" value={localCandidate.preferred_roles.join(", ")} onChange={e => setLocalCandidate({...localCandidate, preferred_roles: e.target.value.split(",").map(s => s.trim())})} placeholder="Preferred roles (comma separated)" />
                    ) : (
                      candidate.preferred_roles.map(r => <span key={r} className="text-sm font-bold text-slate-700">{r}</span>)
                    )}
                  </div>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Preferred Tech Hubs</div>
                  <div className="flex flex-wrap gap-2">
                    {isEditMode ? (
                      <input className="w-full p-2 border rounded text-xs font-bold" value={localCandidate.preferred_locations.join(", ")} onChange={e => setLocalCandidate({...localCandidate, preferred_locations: e.target.value.split(",").map(s => s.trim())})} placeholder="Preferred locations (comma separated)" />
                    ) : (
                      candidate.preferred_locations.map(l => <span key={l} className="text-sm font-bold text-slate-700">{l}</span>)
                    )}
                  </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileView;