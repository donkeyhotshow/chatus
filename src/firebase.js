import { initializeApp } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { logger } from "./lib/logger.js";

// Firebase public config (client-safe values) from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Expose services
export const db = getDatabase(app);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// Connect to emulators in development (dev-only)
const isDev =
  (typeof process !== "undefined" && process.env.NODE_ENV === "development") ||
  (typeof window !== "undefined" && window.location && window.location.hostname === "localhost");

if (isDev) {
  try {
    // Realtime Database emulator (default port 9000)
    connectDatabaseEmulator(db, "localhost", 9000);
    // Auth emulator (default port 9099)
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    // Firestore emulator (default port 8080)
    connectFirestoreEmulator(firestore, "localhost", 8080);
    logger.debug("Connected Firebase services to emulators (dev-only)");
  } catch (e) {
    logger.warn("Failed to connect to Firebase emulators", { error: e });
  }
}
