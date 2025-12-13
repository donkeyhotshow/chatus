import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator, Database } from "firebase/database";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getStorage, connectStorageEmulator, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./firebase-config";
import { logger } from "./logger";

// Initialize app idempotently with better safeguards
let app: FirebaseApp;
let analytics: Analytics | null = null;
let firestore: Firestore;
let rtdb: Database;
let auth: Auth;
let storage: FirebaseStorage;

try {
  const existingApps = getApps();
  
  if (existingApps.length === 0) {
    logger.info("Initializing Firebase app", { 
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      hasDatabaseURL: !!firebaseConfig.databaseURL
    });
    app = initializeApp(firebaseConfig);
  } else {
    logger.info("Using existing Firebase app", { 
      appName: existingApps[0].name,
      projectId: existingApps[0].options.projectId,
      existingAppsCount: existingApps.length
    });
    app = existingApps[0];
  }

  // Initialize services
  firestore = getFirestore(app);
  rtdb = getDatabase(app, firebaseConfig.databaseURL);
  auth = getAuth(app);
  storage = getStorage(app);

  // Analytics only in browser
  if (typeof window !== "undefined") {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      logger.warn("Failed to initialize Analytics", { error });
    }
  }

} catch (error) {
  logger.error("Failed to initialize Firebase", error as Error, { 
    config: {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      hasDatabaseURL: !!firebaseConfig.databaseURL
    }
  });
  
  // Fallback: try to use existing app if initialization fails
  const existingApps = getApps();
  if (existingApps.length > 0) {
    logger.warn("Using fallback: existing Firebase app");
    app = existingApps[0];
    firestore = getFirestore(app);
    rtdb = getDatabase(app, firebaseConfig.databaseURL);
    auth = getAuth(app);
    storage = getStorage(app);
  } else {
    throw error;
  }
}

// Export services
export { app, analytics, firestore, rtdb, auth, storage };

// Enable IndexedDB persistence (best-effort)
if (typeof window !== "undefined") {
  try {
    enableIndexedDbPersistence(firestore).catch((err: any) => {
      if (err?.code === "failed-precondition") {
        logger.warn("Firestore persistence failed: multiple tabs open. Disabled.", { error: err });
      } else if (err?.code === "unimplemented") {
        logger.warn("Firestore persistence not available in this environment. Disabled.", { error: err });
      } else {
        logger.warn("Firestore persistence failed to enable", { error: err });
      }
    });
  } catch (e) {
    logger.warn("Unexpected error enabling Firestore persistence", { error: e });
  }
}

// Connect emulators in development when requested
const useEmulators = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
if (useEmulators) {
  try {
    connectFirestoreEmulator(firestore, process.env.FIRESTORE_EMULATOR_HOST || "localhost", Number(process.env.FIRESTORE_EMULATOR_PORT || 8080));
    connectDatabaseEmulator(rtdb, process.env.RTDB_EMULATOR_HOST || "localhost", Number(process.env.RTDB_EMULATOR_PORT || 9000));
    connectAuthEmulator(auth, `http://${process.env.AUTH_EMULATOR_HOST || "localhost"}:${Number(process.env.AUTH_EMULATOR_PORT || 9099)}`, { disableWarnings: true });
    connectStorageEmulator(storage, process.env.STORAGE_EMULATOR_HOST || "localhost", Number(process.env.STORAGE_EMULATOR_PORT || 9199));
    logger.info("Firebase emulators connected");
  } catch (e) {
    logger.warn("Failed to connect Firebase emulators", { error: e });
  }
}

export default app;

// Backwards-compat helper for modules that import getFirebase()
export function getFirebase() {
  return {
    app,
    db: firestore,
    auth,
    storage,
    rtdb,
    analytics,
  };
}
