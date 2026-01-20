// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// ADDED: signInWithPopup to the imports
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQXPu4_7IvWfZ3jDVEDLaswnghPrO9XJM",
  authDomain: "job-match-6fdd6.firebaseapp.com",
  projectId: "job-match-6fdd6",
  storageBucket: "job-match-6fdd6.firebasestorage.app",
  messagingSenderId: "163551534655",
  appId: "1:163551534655:web:80a297a7d4dd6dcd66628a",
  measurementId: "G-J1CG2RQ5VQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and Export Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // This is required for storing profile data

// --- ADDED: Helper function for Google Sign-In ---
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export default app;
