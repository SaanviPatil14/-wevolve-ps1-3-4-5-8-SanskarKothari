import React, { useEffect, useMemo, useState } from 'react';
import { generateJobDescription, skillResponsibilities } from '../../data/jobTemplates';
import { generateJobDescriptionAI } from '../../services/aiService';
import { Sparkles, CheckCircle, Send, ArrowRight, ArrowLeft, CircleSlash, Brain } from 'lucide-react';

type Props = {
  onClose?: () => void;
  employerId?: string;
  // Props to connect with EmployerDashboard logic
  onUseDescription: (text: string) => void;
  onPublish: (text: string) => void;
  salaryRange: [number, number];
  setSalaryRange: (range: [number, number]) => void;
};

const JobDescriptionGenerator: React.FC<Props> = ({ 
  onClose, 
  onUseDescription, 
  onPublish,
  salaryRange,
  setSalaryRange
}) => {
  const [step, setStep] = useState(1);

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('Tech');
  const [experience, setExperience] = useState<'Entry' | 'Mid' | 'Senior'>('Mid');
  const [culture, setCulture] = useState<'Startup' | 'Corporate' | 'Remote-first'>('Startup');

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  const [variations, setVariations] = useState<any[]>([]);
  const [selectedVariation, setSelectedVariation] = useState(0);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const availableSkills = useMemo(() => Object.keys(skillResponsibilities), []);
  const validateSkills = () => selectedSkills.length >= 3 && selectedSkills.length <= 10;

  const generated = useMemo(() => {
    if (!jobTitle) return null;
    if (variations.length > 0) return variations[selectedVariation];
    return generateJobDescription(
      { jobTitle, company, industry, experience, skills: selectedSkills, culture, specialRequirements },
      0
    );
  }, [jobTitle, company, industry, experience, selectedSkills, culture, specialRequirements, variations, selectedVariation]);

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else if (selectedSkills.length < 10) {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    const s = customSkill.trim();
    if (!s || selectedSkills.includes(s) || selectedSkills.length >= 10) return;
    setSelectedSkills(prev => [...prev, s]);
    setCustomSkill('');
  };

  const handleGenerate = () => {
    if (!jobTitle || !validateSkills()) return;

    setAiLoading(true);
    setAiError(null);

    (async () => {
      try {
        const aiVars = await generateJobDescriptionAI(
          { 
            jobTitle, company, industry, experience, 
            skills: selectedSkills, culture, specialRequirements,
            // Include salary in the AI prompt context
            salary_min: salaryRange[0],
            salary_max: salaryRange[1]
          },
          1
        );
        if (aiVars?.length) setVariations(aiVars);
      } catch {
        setAiError('AI generation failed. Using premium template version.');
        const templateVars = [0, 1].map(v =>
          generateJobDescription(
            { jobTitle, company, industry, experience, skills: selectedSkills, culture, specialRequirements },
            v
          )
        );
        setVariations(templateVars);
      }
      setAiLoading(false);
    })();
  };

  // Construct the final text block for publishing
  const finalFormattedText = useMemo(() => {
    if (!generated) return "";
    return `${generated.about}\n\nKey Responsibilities:\n${generated.responsibilities}\n\nRequirements:\n${generated.requirements}`;
  }, [generated]);

  return (
    <div className="space-y-8">
      {/* Visual Progress Bar */}
      <div className="flex gap-2 mb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-600' : 'bg-slate-100'}`} />
        ))}
      </div>

      {/* STEP 1: Core Identity */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-4">
            <input
              className="w-full p-5 bg-slate-50 border-none rounded-[24px] font-bold outline-none focus:ring-2 ring-indigo-500/20 transition-all text-lg"
              placeholder="Job Title (e.g. Senior Frontend Engineer)"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />
            <input
              className="w-full p-5 bg-slate-50 border-none rounded-[24px] font-bold outline-none focus:ring-2 ring-indigo-500/20 transition-all"
              placeholder="Company Name"
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Industry</label>
              <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold appearance-none cursor-pointer" value={industry} onChange={e => setIndustry(e.target.value)}>
                <option>Tech</option><option>Finance</option><option>Healthcare</option><option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Experience</label>
              <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold appearance-none cursor-pointer" value={experience} onChange={e => setExperience(e.target.value as any)}>
                <option>Entry</option><option>Mid</option><option>Senior</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Culture</label>
              <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold appearance-none cursor-pointer" value={culture} onChange={e => setCulture(e.target.value as any)}>
                <option value="Startup">Startup</option><option value="Corporate">Corporate</option><option value="Remote-first">Remote-first</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Deep Context (Salary & Skills) */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
          {/* SALARY SECTION */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-2">
              Annual Compensation Range
            </label>
            <div className="grid grid-cols-2 gap-4 bg-indigo-50/30 p-6 rounded-[32px] border border-indigo-100/50">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 ml-1">Min Salary</span>
                <input 
                  type="number" 
                  placeholder="e.g. 800000" 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 outline-none focus:ring-2 ring-indigo-500/20 font-bold"
                  value={salaryRange[0] || ""}
                  onChange={(e) => setSalaryRange([parseInt(e.target.value) || 0, salaryRange[1]])}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 ml-1">Max Salary</span>
                <input 
                  type="number" 
                  placeholder="e.g. 1500000" 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 outline-none focus:ring-2 ring-indigo-500/20 font-bold"
                  value={salaryRange[1] || ""}
                  onChange={(e) => setSalaryRange([salaryRange[0], parseInt(e.target.value) || 0])}
                />
              </div>
            </div>
          </div>

          {/* SKILLS SECTION */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Target Skills (Select 3-10)</label>
            <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto p-2 custom-scrollbar">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => handleToggleSkill(skill)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all font-bold text-xs ${
                    selectedSkills.includes(skill)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none"
                placeholder="Add custom skill..."
                value={customSkill}
                onChange={e => setCustomSkill(e.target.value)}
              />
              <button onClick={handleAddCustomSkill} className="px-6 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest uppercase">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Special Requirements */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Special Requirements / Perks</label>
          <textarea
            rows={5}
            className="w-full p-6 bg-slate-50 border-none rounded-[32px] font-bold outline-none focus:ring-2 ring-indigo-500/20 transition-all resize-none"
            placeholder="e.g. Competitive equity, Flexible hours, Must be based in Rourkela..."
            value={specialRequirements}
            onChange={e => setSpecialRequirements(e.target.value)}
          />
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex gap-3 pt-4">
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)} 
            className="px-8 py-5 border-2 border-slate-100 text-slate-400 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
        
        {step < 3 ? (
          <button 
            onClick={() => setStep(step + 1)} 
            className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            Next Step <ArrowRight size={14} />
          </button>
        ) : (
          <button 
            onClick={handleGenerate} 
            disabled={aiLoading || !validateSkills()}
            className="flex-1 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {aiLoading ? (
              <span className="animate-pulse flex items-center gap-2"><Brain className="animate-spin" size={16} /> Engineering Description...</span>
            ) : (
              <><Sparkles size={16} className="text-indigo-400" /> Generate Hiring Intelligence</>
            )}
          </button>
        )}
      </div>

      {/* Result & Bridge Buttons */}
      {generated && (
        <div className="mt-10 p-8 border border-indigo-100 rounded-[40px] bg-indigo-50/20 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <h3 className="font-black text-sm uppercase tracking-widest text-indigo-900">Generated Profile</h3>
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={() => onUseDescription(finalFormattedText)} 
                  className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-600 rounded-2xl font-black text-[10px] tracking-widest border border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
                >
                   <CheckCircle size={14} /> REVIEW & EDIT
                </button>
                <button 
                  onClick={() => onPublish(finalFormattedText)} 
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                   <Send size={14} /> PUBLISH NOW
                </button>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-indigo-50 max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
            <h4 className="font-black text-slate-900 text-xl mb-4 border-b border-slate-50 pb-4">{generated.title}</h4>
            <div className="text-slate-600 whitespace-pre-wrap font-medium leading-relaxed text-sm">
              {finalFormattedText}
            </div>
          </div>
        </div>
      )}

      {aiError && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2 animate-bounce">
          <CircleSlash size={14} /> {aiError}
        </div>
      )}
    </div>
  );
};

export default JobDescriptionGenerator;