import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LogOut } from 'lucide-react';

// Imports
import { Candidate, Job, MatchResult, UserRole } from './types';
import { postJobToFirestore, fetchAllJobs, fetchCandidates, updateCandidateProfile } from './services/dbService';
import { INITIAL_CANDIDATE } from './data/mockData';
import { calculateMatch } from './services/engine';

import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage'; 
import CandidateDashboard from './components/pages/CandidateDashboard'; 
import EmployerDashboard from './components/pages/EmployerDashboard';   
import CandidateProfileView from './components/pages/CandidateProfile'; 

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<UserRole>('candidate');
  
  const [activeCandidate, setActiveCandidate] = useState<Candidate>(INITIAL_CANDIDATE);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [isAiExplaining, setIsAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '', company: '', location: '', required_skills: [], experience_required: '', salary_range: [0, 0]
  });

  // --- AUTH & PROFILE SYNC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserRole(data.role as UserRole);

            if (data.role === 'candidate') {
              setActiveCandidate({
                id: currentUser.uid,
                name: data.name || currentUser.displayName || "User",
                contact_email: data.contact_email || currentUser.email || "",
                contact_phone: data.contact_phone || "",
                address: data.address || "",
                bio: data.bio || "",
                skills: data.skills || [],
                experience_years: data.experience_years || 0,
                preferred_locations: data.preferred_locations || [],
                preferred_roles: data.preferred_roles || [],
                expected_salary: data.expected_salary || 0,
                education: {
                  college: data.education?.college || "",
                  degree: data.education?.degree || "",
                  field: data.education?.field || "",
                  cgpa: data.education?.cgpa || 0,
                },
                avatar: data.avatar || currentUser.photoURL || ""
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setActiveCandidate(INITIAL_CANDIDATE);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- JOB DATA LOADING ---
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const remote = await fetchAllJobs();
        if (mounted && Array.isArray(remote) && remote.length > 0) {
          setJobs(remote);
          setSelectedJob(remote[0]);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // --- MATCHING ENGINE ---
  const runEngine = useCallback(async () => {
    if (userRole === 'candidate') {
      const results = jobs.map(job => calculateMatch(activeCandidate, job));
      results.sort((a, b) => b.match_score - a.match_score);
      setMatches(results);
      if (results.length > 0 && !selectedMatch) setSelectedMatch(results[0]);
    } else {
      if (!selectedJob) return;
      try {
        const candidates = await fetchCandidates();
        const results = candidates.map((cand: any) => ({
          ...calculateMatch(cand as Candidate, selectedJob),
          candidate_details: cand
        }));
        results.sort((a: any, b: any) => b.match_score - a.match_score);
        setMatches(results as MatchResult[]);
        if (results.length > 0 && !selectedMatch) setSelectedMatch(results[0]);
      } catch (err) {
        console.error('Error running engine:', err);
      }
    }
  }, [userRole, activeCandidate, jobs, selectedJob, selectedMatch]);

  useEffect(() => {
    if (location.pathname.includes('dashboard')) {
      runEngine();
    }
  }, [runEngine, location.pathname, selectedJob]);

  const showHeader = location.pathname.includes('dashboard') || location.pathname === '/profile';

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const handleCreateJob = async () => {
    if (!newJob.title) return;
    try {
      const uid = auth.currentUser?.uid || 'unknown';
      const saved = await postJobToFirestore(newJob, uid);
      setJobs(prev => [...prev, saved]);
      setSelectedJob(saved);
      setIsJobModalOpen(false);
      setNewJob({ title: '', company: '', location: '', required_skills: [], experience_required: '', salary_range: [0, 0] });
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 pb-20 transition-colors duration-500 ${userRole === 'candidate' ? 'bg-emerald-50/20' : 'bg-indigo-50/20'}`}>
      {showHeader && (
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">W</div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">
              {userRole === 'candidate' ? 'CANDIDATE' : 'EMPLOYER'}<span className="text-indigo-600">PRO</span>
            </h1>
          </div>
          <div className="flex items-center gap-8">
            {userRole === 'candidate' && (
              <nav className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => navigate('/candidate-dashboard')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${location.pathname === '/candidate-dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Discover</button>
                <button onClick={() => navigate('/profile')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${location.pathname === '/profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>My Profile</button>
              </nav>
            )}
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{userRole === 'candidate' ? activeCandidate.name : 'Talent Acquisition'}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{userRole}</div>
              </div>
              <button onClick={handleLogout} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={showHeader ? "max-w-7xl mx-auto px-6 py-8" : ""}>
        <Routes>
          <Route path="/" element={<LandingPage onStart={() => navigate('/auth')} />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/candidate-dashboard" element={<CandidateDashboard matches={matches} selectedMatch={selectedMatch} setSelectedMatch={setSelectedMatch} activeCandidate={activeCandidate} isAiExplaining={isAiExplaining} aiExplanation={aiExplanation} />} />
          <Route path="/profile" element={
            <CandidateProfileView candidate={activeCandidate} editable onUpdate={async (updated) => {
              setActiveCandidate(updated);
              try {
                if (auth.currentUser?.uid) {
                  await updateCandidateProfile(auth.currentUser.uid, updated);
                }
              } catch (err) {
                console.error('Error saving profile:', err);
              }
            }} />
          } />
          <Route path="/employer-dashboard" element={<EmployerDashboard jobs={jobs} selectedJob={selectedJob} setSelectedJob={setSelectedJob} matches={matches} selectedMatch={selectedMatch} setSelectedMatch={setSelectedMatch} isJobModalOpen={isJobModalOpen} setIsJobModalOpen={setIsJobModalOpen} newJob={newJob} setNewJob={setNewJob} handleCreateJob={handleCreateJob} isAiExplaining={isAiExplaining} aiExplanation={aiExplanation} />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;