import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

// Idempotent app init
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const isBrowser = typeof window !== "undefined";

// Analytics: init only when supported in browser
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (isBrowser) {
  analyticsIsSupported()
    .then((supported) => {
      if (supported) {
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

const auth = getAuth(app);
const db = getDatabase(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

let messaging: ReturnType<typeof getMessaging> | null = null;
if (isBrowser) {
  try {
    messaging = getMessaging(app);
  } catch {
    messaging = null;
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
