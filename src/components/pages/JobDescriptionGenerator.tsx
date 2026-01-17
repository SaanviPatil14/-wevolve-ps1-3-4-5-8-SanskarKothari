import React, { useEffect, useMemo, useState } from 'react';
import { generateJobDescription, skillResponsibilities } from '../../data/jobTemplates';
import { generateJobDescriptionAI } from '../../services/aiService';
import { saveGeneratedDescription } from '../../services/dbService';

type Props = {
  onClose?: () => void;
  employerId?: string;
};

const JobDescriptionGenerator: React.FC<Props> = ({ onClose, employerId }) => {
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
  const [saved, setSaved] = useState(false);

  const availableSkills = useMemo(() => Object.keys(skillResponsibilities), []);

  const validateSkills = () => selectedSkills.length >= 3 && selectedSkills.length <= 10;

  const generated = useMemo(() => {
    if (!jobTitle) return null;
    if (variations.length > 0) return variations[selectedVariation];
    return generateJobDescription(
      { jobTitle, company, industry, experience, skills: selectedSkills, culture, specialRequirements },
      0
    );
  }, [
    jobTitle,
    company,
    industry,
    experience,
    selectedSkills,
    culture,
    specialRequirements,
    variations,
    selectedVariation
  ]);

  useEffect(() => {
    setSaved(false);
  }, [generated]);

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

    const templateVars = [0, 1].map(v =>
      generateJobDescription(
        { jobTitle, company, industry, experience, skills: selectedSkills, culture, specialRequirements },
        v
      )
    );

    setVariations(templateVars);
    setAiLoading(true);
    setAiError(null);

    (async () => {
      try {
        const aiVars = await generateJobDescriptionAI(
          { jobTitle, company, industry, experience, skills: selectedSkills, culture, specialRequirements },
          1
        );
        if (aiVars?.length) setVariations(aiVars);
      } catch {
        setAiError('AI generation failed. Using template version.');
      }
      setAiLoading(false);
    })();
  };

  return (
    <div className="p-6 bg-white rounded-xl w-full max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">AI-Powered Job Description Generator</h2>
        {onClose && (
          <button onClick={onClose} className="text-sm text-slate-500">Close</button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="text-sm text-slate-500">Step {step} / 3</div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-3">
          <input
            className="w-full p-3 border rounded"
            placeholder="Job Title (required)"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
          />

          <input
            className="w-full p-3 border rounded"
            placeholder="Company"
            value={company}
            onChange={e => setCompany(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-2">
            <select className="p-3 border rounded" value={industry} onChange={e => setIndustry(e.target.value)}>
              <option>Tech</option>
              <option>Finance</option>
              <option>Healthcare</option>
              <option>Other</option>
            </select>

            <select className="p-3 border rounded" value={experience} onChange={e => setExperience(e.target.value as any)}>
              <option>Entry</option>
              <option>Mid</option>
              <option>Senior</option>
            </select>

            <select className="p-3 border rounded" value={culture} onChange={e => setCulture(e.target.value as any)}>
              <option value="Startup">Startup</option>
              <option value="Corporate">Corporate</option>
              <option value="Remote-first">Remote-first</option>
            </select>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-3">
          <label className="text-sm text-slate-600">Select 3–10 skills</label>

          <div className="flex flex-wrap gap-2">
            {availableSkills.map(skill => (
              <button
                key={skill}
                onClick={() => handleToggleSkill(skill)}
                className={`px-3 py-2 rounded-full border ${
                  selectedSkills.includes(skill)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 p-2 border rounded"
              placeholder="Add custom skill"
              value={customSkill}
              onChange={e => setCustomSkill(e.target.value)}
            />
            <button onClick={handleAddCustomSkill} className="px-4 py-2 bg-indigo-600 text-white rounded">
              Add
            </button>
          </div>

          {!validateSkills() && (
            <div className="text-sm text-red-500">Select between 3 and 10 skills.</div>
          )}
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-3">
          <label className="text-sm text-slate-600">Special Requirements (optional)</label>
          <textarea
            rows={3}
            className="w-full p-3 border rounded"
            value={specialRequirements}
            onChange={e => setSpecialRequirements(e.target.value)}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="px-4 py-2 border rounded">
            Back
          </button>
        )}
        {step < 3 && (
          <button onClick={() => setStep(step + 1)} className="px-4 py-2 bg-indigo-600 text-white rounded">
            Next
          </button>
        )}
        {step === 3 && (
          <button onClick={handleGenerate} className="px-4 py-2 bg-indigo-600 text-white rounded">
            {aiLoading ? 'Generating…' : 'Generate'}
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="p-4 border rounded bg-slate-50">
        {!generated ? (
          <div className="text-slate-400">
            Fill in the job title and skills to preview the description.
          </div>
        ) : (
          <>
            <h3 className="font-black text-lg">{generated.title}</h3>
            <p className="mt-2">{generated.about}</p>
          </>
        )}

        {aiLoading && <div className="text-sm text-indigo-600 mt-2">AI is generating…</div>}
        {aiError && <div className="text-sm text-red-600 mt-2">{aiError}</div>}
      </div>
    </div>
  );
};

export default JobDescriptionGenerator;
