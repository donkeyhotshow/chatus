import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import type { Database } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import type { Messaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

// =============================================================================
// FIREBASE FALLBACK CONFIGURATION
// =============================================================================

// Primary configuration
const primaryConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Fallback configuration for offline/demo mode
const fallbackConfig = {
  apiKey: "demo-key-for-offline-mode",
  authDomain: "demo.firebaseapp.com",
  databaseURL: "https://demo.firebaseio.com",
  projectId: "demo-project",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo123",
  measurementId: "G-DEMO123",
};

// Check if primary config is valid
const hasValidPrimaryConfig = Boolean(
  primaryConfig.apiKey &&
  primaryConfig.projectId &&
  primaryConfig.apiKey !== "demo-key-for-offline-mode"
);

// Check if we should use offline mode
const useOfflineMode = process.env.FIREBASE_OFFLINE_MODE === 'true' || !hasValidPrimaryConfig;

// Use appropriate configuration
let firebaseConfig = useOfflineMode ? fallbackConfig : primaryConfig;

// Check if we have valid Firebase config (not during build time)
const hasValidConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

// If primary config is not valid, use fallback
if (!hasValidPrimaryConfig) {
  firebaseConfig = fallbackConfig;
}

// Firebase config validation (development only)
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('Firebase config check:', {
    hasValidConfig,
    hasValidPrimaryConfig,
    useOfflineMode,
    apiKey: firebaseConfig.apiKey ? 'present' : 'missing',
    projectId: firebaseConfig.projectId ? 'present' : 'missing',
    isBrowser: typeof window !== 'undefined'
  });
}

// Only initialize Firebase if we have valid config AND we're in browser
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

const isBrowser = typeof window !== "undefined";

// =============================================================================
// FIREBASE INITIALIZATION WITH FALLBACK SUPPORT
// =============================================================================

// Initialize Firebase only if config is valid AND we're in browser
if (hasValidConfig && isBrowser) {
  try {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Initializing Firebase...', {
        mode: useOfflineMode ? 'OFFLINE/DEMO' : 'PRODUCTION',
        config: firebaseConfig.projectId
      });
    }

    // Ensure we don't initialize multiple times
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Using existing Firebase app');
      }
    } else {
      // Initialize Firebase synchronously
      try {
        app = initializeApp(firebaseConfig);

        // Add error handling for network issues
        if (useOfflineMode) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn('Firebase initialized in OFFLINE/DEMO mode - some features may not work');
          }
        }

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Firebase initialization failed:', error);
          console.warn('Falling back to offline mode...');
        }

        // Try to initialize with fallback config
        try {
          app = initializeApp(fallbackConfig);
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('Fallback Firebase initialization successful');
          }
        } catch (fallbackError) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Fallback Firebase initialization also failed:', fallbackError);
          }
          app = null;
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Firebase app initialized:', !!app, {
        projectId: app?.options?.projectId || 'unknown'
      });
    }

    if (app) {
      // Initialize services with error handling
      try {
        auth = getAuth(app);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('Firebase auth initialized:', !!auth);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('Firebase auth initialization failed:', error);
        }
      }

      try {
        db = getDatabase(app);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('Firebase database initialized:', !!db);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('Firebase database initialization failed:', error);
        }
      }

      try {
        firestore = getFirestore(app);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('Firebase firestore initialized:', !!firestore);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('Firebase firestore initialization failed:', error);
        }
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
