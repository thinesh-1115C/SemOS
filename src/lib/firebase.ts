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
  serverTimestamp,
  onSnapshot
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
      semester: "Semester 1",
      major: "Academic Studies",
      targetGpa: 4.0,
      currentCgpa: 0,
      targetCgpa: 4.0,
      rigorLevel: 'maintenance',
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
          semester: "Semester 1",
          major: "Academic Studies",
          targetGpa: 4.0,
          currentCgpa: 0,
          targetCgpa: 4.0,
          rigorLevel: 'maintenance',
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
    const userRef = doc(db, "users", uid);
    const profileRef = doc(db, "profiles", uid);
    
    const [userSnap, profileSnap] = await Promise.all([
      getDoc(userRef).catch(() => null),
      getDoc(profileRef).catch(() => null)
    ]);

    const userData = userSnap?.exists() ? userSnap.data() : {};
    const profileData = profileSnap?.exists() ? profileSnap.data() : {};

    const merged = { ...userData, ...profileData };
    if (Object.keys(merged).length > 0) {
      return merged as FirebaseUserProfile;
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
  const profilePath = `profiles/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    const profileRef = doc(db, "profiles", uid);
    await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    await setDoc(profileRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error("Error updating user profile doc:", err);
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
}

export async function saveProfileToProfilesCollection(uid: string, data: any) {
  const profilePath = `profiles/${uid}`;
  try {
    const profileRef = doc(db, "profiles", uid);
    await setDoc(profileRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error("Error saving to profiles collection:", err);
    handleFirestoreError(err, OperationType.WRITE, profilePath);
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

export async function updateOnlinePresence(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }, currentView?: string) {
  if (!user || !user.uid) return;
  const path = `online_users/${user.uid}`;
  try {
    const ref = doc(db, "online_users", user.uid);
    await setDoc(ref, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || '',
      currentView: currentView || 'dashboard',
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error("Error updating online presence:", err);
  }
}

export async function getOnlineUsers() {
  const path = `online_users`;
  try {
    const colRef = collection(db, "online_users");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error getting online users:", err);
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export function subscribeToOnlineUsers(callback: (users: any[]) => void) {
  try {
    const colRef = collection(db, "online_users");
    return onSnapshot(colRef, (snap) => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(users);
    }, (err) => {
      console.error("Error subscribing to online users:", err);
    });
  } catch (err) {
    console.error("Error setting up online users subscription:", err);
    return () => {};
  }
}

export async function submitFirestoreAccessRequest(req: { id: string; email: string; name?: string; reason?: string; requestedAt: string; status: string }) {
  try {
    const ref = doc(db, "access_requests", req.id);
    await setDoc(ref, req, { merge: true });
  } catch (err) {
    console.error("Error submitting access request to firestore:", err);
  }
}

export async function getFirestoreAccessRequests() {
  try {
    const colRef = collection(db, "access_requests");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => d.data() as any);
  } catch (err) {
    console.error("Error getting access requests from firestore:", err);
    return [];
  }
}

export function subscribeToAccessRequests(callback: (requests: any[]) => void) {
  try {
    const colRef = collection(db, "access_requests");
    return onSnapshot(colRef, (snap) => {
      const reqs = snap.docs.map(d => d.data());
      callback(reqs);
    }, (err) => {
      console.error("Error in access requests subscription:", err);
    });
  } catch (err) {
    console.error("Error setting up access requests subscription:", err);
    return () => {};
  }
}

export async function updateFirestoreAccessRequestStatus(requestId: string, status: 'approved' | 'rejected') {
  try {
    const ref = doc(db, "access_requests", requestId);
    await setDoc(ref, { status }, { merge: true });
  } catch (err) {
    console.error("Error updating access request status in firestore:", err);
  }
}

export async function getFirestoreAllowlistConfig() {
  try {
    const ref = doc(db, "settings", "allowlist");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as { enabled: boolean; allowedEmails: string[] };
    }
    return null;
  } catch (err) {
    console.error("Error fetching allowlist config from firestore:", err);
    return null;
  }
}

export async function updateFirestoreAllowlistConfig(enabled: boolean, allowedEmails: string[]) {
  try {
    const ref = doc(db, "settings", "allowlist");
    await setDoc(ref, {
      enabled,
      allowedEmails: allowedEmails.map(e => e.trim().toLowerCase()),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Error updating allowlist config in firestore:", err);
  }
}

export function subscribeToAllowlistConfig(callback: (config: { enabled: boolean; allowedEmails: string[] }) => void) {
  try {
    const ref = doc(db, "settings", "allowlist");
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
          allowedEmails: Array.isArray(data.allowedEmails) ? data.allowedEmails : ['thinesh10048@gmail.com']
        });
      }
    }, (err) => {
      console.error("Error in allowlist config subscription:", err);
    });
  } catch (err) {
    console.error("Error setting up allowlist config subscription:", err);
    return () => {};
  }
}



