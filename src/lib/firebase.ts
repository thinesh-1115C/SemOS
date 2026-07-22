import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import firebaseConfigData from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfigData.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();

// User Auth Interfaces
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirebaseUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  semester?: string;
  major?: string;
  targetGpa?: number;
  currentCgpa?: number;
  targetCgpa?: number;
  rigorLevel?: 'maintenance' | 'target_push' | 'high_rigor';
  createdAt?: any;
}

// Authentication Helpers
export async function signUpWithEmail(email: string, pass: string, name: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && userCredential.user) {
    await updateProfile(userCredential.user, { displayName: name });
  }
  // Initialize user profile document in Firestore
  const userPath = `users/${userCredential.user.uid}`;
  try {
    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: email,
      displayName: name || email.split("@")[0],
      photoURL: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`,
      semester: "Semester 3",
      major: "Computer Science & Engineering",
      targetGpa: 9.0,
      currentCgpa: 7.8,
      targetCgpa: 9.0,
      rigorLevel: 'target_push',
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }

  return userCredential.user;
}

export async function signInWithEmail(email: string, pass: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export async function signInWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider);
  if (userCredential.user) {
    const userPath = `users/${userCredential.user.uid}`;
    const userDocRef = doc(db, "users", userCredential.user.uid);
    let existing;
    try {
      existing = await getDoc(userDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, userPath);
      return userCredential.user;
    }
    if (existing && !existing.exists()) {
      try {
        await setDoc(userDocRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`,
          semester: "Semester 3",
          major: "Computer Science & Engineering",
          targetGpa: 9.0,
          currentCgpa: 7.8,
          targetCgpa: 9.0,
          rigorLevel: 'target_push',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      }
    }
  }
  return userCredential.user;
}

export async function logOut() {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export const subscribeToAuthChanges = subscribeToAuth;

// User Data Sync
export async function fetchUserProfile(uid: string): Promise<FirebaseUserProfile | null> {
  const userPath = `users/${uid}`;
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as FirebaseUserProfile;
    }
    return null;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    try {
      handleFirestoreError(err, OperationType.GET, userPath);
    } catch {
      // Return null fallback for non-fatal profile loading
    }
    return null;
  }
}

export const getUserProfile = fetchUserProfile;

export async function updateUserProfileDoc(uid: string, data: Partial<FirebaseUserProfile>) {
  const userPath = `users/${uid}`;
  try {
    const ref = doc(db, "users", uid);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error("Error updating user profile doc:", err);
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
}

// User Firestore Collections
export async function saveUserStudyPlan(uid: string, planData: any) {
  const path = `users/${uid}/studyPlans`;
  try {
    const colRef = collection(db, "users", uid, "studyPlans");
    const docRef = await addDoc(colRef, {
      ...planData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Error saving study plan:", err);
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function getUserStudyPlans(uid: string) {
  const path = `users/${uid}/studyPlans`;
  try {
    const colRef = collection(db, "users", uid, "studyPlans");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error getting user study plans:", err);
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function saveUserDocument(uid: string, docData: any) {
  const path = `users/${uid}/documents`;
  try {
    const colRef = collection(db, "users", uid, "documents");
    const docRef = await addDoc(colRef, {
      ...docData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Error saving user document:", err);
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function getUserDocuments(uid: string) {
  const path = `users/${uid}/documents`;
  try {
    const colRef = collection(db, "users", uid, "documents");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error getting user documents:", err);
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function saveUserCgpaRecord(uid: string, cgpaRecord: any) {
  const path = `users/${uid}/academic/cgpa`;
  try {
    const ref = doc(db, "users", uid, "academic", "cgpa");
    await setDoc(ref, { ...cgpaRecord, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error("Error saving CGPA record:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserCgpaRecord(uid: string) {
  const path = `users/${uid}/academic/cgpa`;
  try {
    const ref = doc(db, "users", uid, "academic", "cgpa");
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    return null;
  } catch (err) {
    console.error("Error getting CGPA record:", err);
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

function cleanFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanFirestoreData);
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      result[key] = cleanFirestoreData(val);
    }
  }
  return result;
}

export async function saveUserRevisionTasksBatch(uid: string, tasks: any[]) {
  const path = `users/${uid}/revisionTasks`;
  try {
    for (const task of tasks) {
      const ref = doc(db, "users", uid, "revisionTasks", task.id);
      const cleaned = cleanFirestoreData(task);
      await setDoc(ref, {
        ...cleaned,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.error("Error batch saving revision tasks:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateUserRevisionTask(uid: string, taskId: string, data: any) {
  const path = `users/${uid}/revisionTasks/${taskId}`;
  try {
    const ref = doc(db, "users", uid, "revisionTasks", taskId);
    const cleaned = cleanFirestoreData(data);
    await setDoc(ref, {
      ...cleaned,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error("Error updating revision task:", err);
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function getUserRevisionTasks(uid: string) {
  const path = `users/${uid}/revisionTasks`;
  try {
    const colRef = collection(db, "users", uid, "revisionTasks");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error getting revision tasks:", err);
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

