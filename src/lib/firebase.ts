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

// Firebase config validation (development only)
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('Firebase config check:', {
    hasValidConfig,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'present' : 'missing',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'present' : 'missing',
    isBrowser: typeof window !== 'undefined'
  });
}

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

// Only initialize Firebase if we have valid config AND we're in browser
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

const isBrowser = typeof window !== "undefined";

// Initialize Firebase only if config is valid AND we're in browser
if (hasValidConfig && isBrowser) {
  try {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Initializing Firebase...');
    }
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Firebase app initialized:', !!app);
    }

    if (app) {
      auth = getAuth(app);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Firebase auth initialized:', !!auth);
      }

      db = getDatabase(app);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Firebase database initialized:', !!db);
      }

      firestore = getFirestore(app);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Firebase firestore initialized:', !!firestore);
      }

      storage = getStorage(app);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Firebase storage initialized:', !!storage);
      }

      // Analytics: init only when supported in browser
      analyticsIsSupported()
        .then((supported) => {
          if (supported && app) {
            try {
              analytics = getAnalytics(app);
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.log('Firebase analytics initialized:', !!analytics);
              }
            } catch {
              analytics = null;
            }
          }
        })
        .catch(() => {
          analytics = null;
        });

      // Messaging: browser only
      try {
        messaging = getMessaging(app);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('Firebase messaging initialized:', !!messaging);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('Firebase messaging initialization failed:', error);
        }
        messaging = null;
      }
    }
  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Firebase initialization failed:', error);
      // eslint-disable-next-line no-console
      console.warn('Firebase initialization skipped (build time or invalid config)');
    }
  }
} else {
  if (process.env.NODE_ENV === 'development') {
    if (!isBrowser) {
      // eslint-disable-next-line no-console
      console.log('Firebase initialization skipped (server-side)');
    } else {
      // eslint-disable-next-line no-console
      console.warn('Firebase config invalid or missing');
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
