import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAOktp5RXdMr2GYiNnVhqc6X2rDxQUi1iE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "microservice-78e2f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "microservice-78e2f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "microservice-78e2f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "667240236597",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:667240236597:web:395bc64d40ffc36ce6937c",
  measurementId: "G-KLJC1L52NC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authentication functions
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signUpUser = async (email, password, userData = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      createdAt: new Date(),
      ...userData
    });
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// User profile functions
export const createUserProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, 'users', userId), profileData, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resume analysis functions
export const saveResumeAnalysis = async (userId, analysisData) => {
  try {
    const docRef = await addDoc(collection(db, 'resume_analyses'), {
      userId,
      ...analysisData,
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserAnalyses = async (userId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'resume_analyses'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const analyses = [];
    
    querySnapshot.forEach((doc) => {
      analyses.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: analyses };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Job metadata functions
export const saveJobMetadata = async (jobData) => {
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...jobData,
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getJobsByCriteria = async (criteria, limitCount = 50) => {
  try {
    let q = collection(db, 'jobs');
    
    // Apply filters based on criteria
    if (criteria.location) {
      q = query(q, where('location', '==', criteria.location));
    }
    if (criteria.jobType) {
      q = query(q, where('jobType', '==', criteria.jobType));
    }
    if (criteria.salaryMin) {
      q = query(q, where('salaryMin', '>=', criteria.salaryMin));
    }
    if (criteria.salaryMax) {
      q = query(q, where('salaryMax', '<=', criteria.salaryMax));
    }
    
    q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    const jobs = [];
    
    querySnapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: jobs };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Analytics and logging functions
export const logUserActivity = async (userId, activityType, details = {}) => {
  try {
    await addDoc(collection(db, 'user_activities'), {
      userId,
      activityType,
      details,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// File storage functions
export const uploadResumeFile = async (userId, file) => {
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      return { success: false, error: 'User not authenticated or userId mismatch' };
    }

    const storageRef = ref(storage, `resumes/${userId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteResumeFile = async (userId, filename) => {
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      return { success: false, error: 'User not authenticated or userId mismatch' };
    }

    const storageRef = ref(storage, `resumes/${userId}/${filename}`);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
};

export default app;

