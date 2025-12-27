/**
 * P1 FIX: Lazy-loaded Firebase modules for better bundle splitting
 * Import these instead of direct firebase imports for non-critical paths
 */

// Firestore lazy loader
export async function getFirestoreLazy() {
  const { getFirestore, collection, doc, query, where, orderBy, limit,
          onSnapshot, addDoc, updateDoc, deleteDoc, getDocs, getDoc,
          serverTimestamp, Timestamp, writeBatch } = await import('firebase/firestore');
  return {
    getFirestore,
    collection,
    doc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    serverTimestamp,
    Timestamp,
    writeBatch,
  };
}

// Realtime Database lazy loader
export async function getRealtimeDBLazy() {
  const { getDatabase, ref, push, set, remove, onValue, onChildAdded,
          onChildRemoved, off, update } = await import('firebase/database');
  return {
    getDatabase,
    ref,
    push,
    set,
    remove,
    onValue,
    onChildAdded,
    onChildRemoved,
    off,
    update,
  };
}

// Storage lazy loader
export async function getStorageLazy() {
  const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage');
  return {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
  };
}

// Auth lazy loader
export async function getAuthLazy() {
  const { getAuth, signInAnonymously, onAuthStateChanged } = await import('firebase/auth');
  return {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
  };
}

// Analytics lazy loader (only load when needed)
export async function getAnalyticsLazy() {
  const { getAnalytics, logEvent, setUserProperties } = await import('firebase/analytics');
  return {
    getAnalytics,
    logEvent,
    setUserProperties,
  };
}

// Preload Firebase modules on idle
export function preloadFirebaseModules() {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload critical modules
      import('firebase/firestore');
      import('firebase/database');
    }, { timeout: 5000 });
  }
}
