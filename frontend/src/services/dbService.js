import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  deleteDoc,    // Added for removing documents
  arrayRemove,  // Added for updating lists
  writeBatch    // Added for efficient bulk deletion
} from "firebase/firestore";
import { db } from "../firebase";

// --- CANDIDATES / USERS ---

export const fetchCandidates = async () => {
  try {
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'candidate'));
    const snap = await getDocs(usersQuery);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching candidates', err);
    return [];
  }
};

export const updateCandidateProfile = async (candidateId, updatedData) => {
  try {
    const userRef = doc(db, "users", candidateId);
    
    await updateDoc(userRef, {
      name: updatedData.name,
      address: updatedData.address,
      bio: updatedData.bio,
      contact_email: updatedData.contact_email || "",
      contact_phone: updatedData.contact_phone || "",
      skills: updatedData.skills,
      experience_years: updatedData.experience_years,
      expected_salary: updatedData.expected_salary,
      preferred_locations: updatedData.preferred_locations,
      preferred_roles: updatedData.preferred_roles,
      "education.college": updatedData.education.college,
      "education.degree": updatedData.education.degree,
      "education.field": updatedData.education.field,
      "education.cgpa": updatedData.education.cgpa,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// --- JOBS ---

export const postJobToFirestore = async (jobData, employerId) => {
  try {
    const docRef = await addDoc(collection(db, "jobs"), {
      ...jobData,
      // Ensure description is captured, default to empty string if missing
      description: jobData.description || "", 
      employer_id: employerId,
      created_at: new Date().toISOString(),
      deadline: jobData.deadline || null, 
      applicants: [] 
    });
    return { ...jobData, job_id: docRef.id };
  } catch (error) {
    console.error("Error posting job:", error);
    throw error;
  }
};

export const fetchAllJobs = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "jobs"));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      job_id: doc.id
    }));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
};

/**
 * NEW: Fetch only jobs created by a specific employer
 */
export const fetchEmployerJobs = async (employerId) => {
  try {
    const jobsQuery = query(collection(db, "jobs"), where("employer_id", "==", employerId));
    const querySnapshot = await getDocs(jobsQuery);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      job_id: doc.id
    }));
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    return [];
  }
};

/**
 * NEW: Delete a complete Job Vacancy
 * Also deletes all applications associated with this job
 */
export const deleteJobFromFirestore = async (jobId) => {
  try {
    // 1. Delete the job document itself
    await deleteDoc(doc(db, "jobs", jobId));

    // 2. Find and delete all applications for this specific job
    const appsQuery = query(collection(db, "applications"), where("job_id", "==", jobId));
    const appsSnap = await getDocs(appsQuery);
    
    // Using a batch for efficiency if there are many applications
    const batch = writeBatch(db);
    appsSnap.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("Error deleting job and applications:", error);
    throw error;
  }
};

// --- APPLICATIONS ---

export const applyForJob = async (jobId, candidateProfile) => {
  try {
    const candidateId = candidateProfile.id || candidateProfile.uid;
    
    const existsQuery = query(
      collection(db, 'applications'), 
      where('job_id', '==', jobId), 
      where('candidate_id', '==', candidateId)
    );
    const existsSnap = await getDocs(existsQuery);
    
    if (!existsSnap.empty) {
      return { success: false, alreadyApplied: true };
    }

    const docRef = await addDoc(collection(db, "applications"), {
      job_id: jobId,
      candidate_id: candidateId,
      candidate_name: candidateProfile.name,
      candidate_email: candidateProfile.contact_email || candidateProfile.email || "",
      candidate_profile: candidateProfile, 
      status: 'pending',
      applied_at: new Date().toISOString()
    });

    const jobRef = doc(db, "jobs", jobId);
    await updateDoc(jobRef, {
      applicants: arrayUnion(candidateId)
    });

    return { success: true, applicationId: docRef.id };
  } catch (error) {
    console.error("Error applying:", error);
    throw error;
  }
};

export const hasApplied = async (jobId, candidateId) => {
  try {
    if (!jobId || !candidateId) return false;
    const q = query(
      collection(db, 'applications'), 
      where('job_id', '==', jobId), 
      where('candidate_id', '==', candidateId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.error('Error checking application existence', err);
    return false;
  }
};

export const fetchEmployerApplications = async (employerId) => {
  try {
    // Fetch all jobs created by this employer
    const jobsQuery = query(collection(db, "jobs"), where("employer_id", "==", employerId));
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobIds = jobsSnapshot.docs.map(d => d.id);
    
    if (jobIds.length === 0) return [];

    // Fetch only applications for this employer's jobs
    const appsQuery = query(collection(db, "applications"), where("job_id", "in", jobIds));
    const appsSnapshot = await getDocs(appsQuery);

    return appsSnapshot.docs.map(doc => ({
      application_id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
};

export const deleteApplication = async (applicationId, jobId, candidateId) => {
  try {
    await deleteDoc(doc(db, "applications", applicationId));

    const jobRef = doc(db, "jobs", jobId);
    await updateDoc(jobRef, {
      applicants: arrayRemove(candidateId)
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting application:", error);
    throw error;
  }
};

// --- GENERATED DESCRIPTIONS ---

export const fetchGeneratedDescriptions = async (employerId) => {
  try {
    const q = query(collection(db, 'generated_descriptions'), where('employer_id', '==', employerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching generated descriptions:', error);
    return [];
  }
};

export const saveGeneratedDescription = async (employerId, descData) => {
  try {
    const docRef = await addDoc(collection(db, "generated_descriptions"), {
      ...descData,
      employer_id: employerId,
      created_at: new Date().toISOString()
    });
    return { ...descData, id: docRef.id };
  } catch (error) {
    console.error('Error saving generated description:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (applicationId, newStatus) => {
  try {
    const appRef = doc(db, "applications", applicationId);
    await updateDoc(appRef, {
      status: newStatus,
      updated_at: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
};

/**
 * NEW: Get the application status for a candidate's specific job application
 */
export const getApplicationStatus = async (jobId, candidateId) => {
  try {
    if (!jobId || !candidateId) return null;
    const q = query(
      collection(db, 'applications'),
      where('job_id', '==', jobId),
      where('candidate_id', '==', candidateId)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    const appData = snap.docs[0].data();
    return {
      application_id: snap.docs[0].id,
      status: appData.status,
      applied_at: appData.applied_at,
      interview_scheduled: appData.interview_scheduled || null,
      interview_date: appData.interview_date || null,
      interview_time: appData.interview_time || null,
      interview_location: appData.interview_location || null,
      ...appData
    };
  } catch (err) {
    console.error('Error fetching application status:', err);
    return null;
  }
};

/**
 * Schedule an interview for a candidate
 */
export const scheduleInterview = async (applicationId, interviewData) => {
  try {
    const appRef = doc(db, 'applications', applicationId);
    await updateDoc(appRef, {
      status: 'interview_scheduled',
      interview_scheduled: true,
      interview_date: interviewData.date,
      interview_time: interviewData.time,
      interview_location: interviewData.location,
      interview_type: interviewData.type || 'video', // video, in-person, phone
      interview_notes: interviewData.notes || '',
      updated_at: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('Error scheduling interview:', err);
    return false;
  }
};

/**
 * Get interview details for a candidate
 */
export const getInterviewDetails = async (jobId, candidateId) => {
  try {
    if (!jobId || !candidateId) return null;
    const q = query(
      collection(db, 'applications'),
      where('job_id', '==', jobId),
      where('candidate_id', '==', candidateId)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    const appData = snap.docs[0].data();
    if (!appData.interview_scheduled) return null;
    
    return {
      interview_date: appData.interview_date,
      interview_time: appData.interview_time,
      interview_location: appData.interview_location,
      interview_type: appData.interview_type,
      interview_notes: appData.interview_notes
    };
  } catch (err) {
    console.error('Error fetching interview details:', err);
    return null;
  }
};