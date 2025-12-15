import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import { getFirestore, Firestore } from "firebase/firestore";
import { getMessaging, Messaging } from "firebase/messaging";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Check if we have valid Firebase config (not during build time)
const hasValidConfig = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://dummy.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};

// Only initialize Firebase if we have valid config
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

const isBrowser = typeof window !== "undefined";

// Initialize Firebase only if config is valid
if (hasValidConfig) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

    auth = getAuth(app);
    db = getDatabase(app);
    firestore = getFirestore(app);
    storage = getStorage(app);

    // Analytics: init only when supported in browser
    if (isBrowser) {
      analyticsIsSupported()
        .then((supported) => {
          if (supported && app) {
            try {
              analytics = getAnalytics(app);
            } catch {
              analytics = null;
            }
          }
        })
        .catch(() => {
          analytics = null;
        });
    }

    // Messaging: browser only
    if (isBrowser) {
      try {
        messaging = getMessaging(app);
      } catch {
        messaging = null;
      }
    }
  } catch (error) {
    // Silently fail during build time
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Firebase initialization skipped (build time or invalid config)');
    }
  }
}

export function getClientFirebase() {
  return {
    app,
    analytics,
    auth,
    rtdb: db,
    firestore,
    messaging,
    storage,
  };
}

export { app, analytics, auth, db, firestore, messaging, storage };
export default app;
