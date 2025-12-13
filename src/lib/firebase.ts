import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { firebaseConfig } from "./firebase-config";

// Initialize app idempotently
const app = !getApps().length ? initializeApp(firebaseConfig as any) : getApps()[0];

// Analytics only in browser
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Export services
export const firestore = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable IndexedDB persistence (best-effort)
try {
  enableIndexedDbPersistence(firestore).catch((err: any) => {
    if (err?.code === "failed-precondition") {
      console.warn("Firestore persistence failed: multiple tabs open. Disabled.", err);
    } else if (err?.code === "unimplemented") {
      console.warn("Firestore persistence not available in this environment. Disabled.", err);
    } else {
      console.warn("Firestore persistence failed to enable:", err);
    }
  });
} catch (e) {
  console.warn("Unexpected error enabling Firestore persistence:", e);
}

// Connect emulators in development when requested
const useEmulators = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
if (useEmulators) {
  try {
    connectFirestoreEmulator(firestore, process.env.FIRESTORE_EMULATOR_HOST || "localhost", Number(process.env.FIRESTORE_EMULATOR_PORT || 8080));
    connectDatabaseEmulator(rtdb, process.env.RTDB_EMULATOR_HOST || "localhost", Number(process.env.RTDB_EMULATOR_PORT || 9000));
    connectAuthEmulator(auth, `http://${process.env.AUTH_EMULATOR_HOST || "localhost"}:${Number(process.env.AUTH_EMULATOR_PORT || 9099)}`, { disableWarnings: true });
    connectStorageEmulator(storage, process.env.STORAGE_EMULATOR_HOST || "localhost", Number(process.env.STORAGE_EMULATOR_PORT || 9199));
  } catch (e) {
    console.warn("Failed to connect Firebase emulators:", e);
  }
}

export default app;
