
"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Database } from 'firebase/database';
import { Messaging } from 'firebase/messaging';
import { Analytics } from 'firebase/analytics';
import { getClientFirebase } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { FCMManager } from '@/lib/firebase-messaging';
import { createPresenceManager } from '@/lib/presence';
import { useRef } from 'react';

interface FirebaseContextType {
  app: FirebaseApp | null;
  firestore: Firestore | null;
  db: Firestore | null;
  user?: User | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  rtdb: Database | null;
  analytics: Analytics | null;
  messaging: Messaging | null;
  presenceManager?: unknown | null;
  fcmManager?: unknown | null; // FCMManager | null;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const useFirebase = (): FirebaseContextType => {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    // More detailed error for debugging
    console.error('useFirebase called outside of FirebaseProvider. Make sure the component is wrapped in FirebaseProvider.');
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return ctx;
};

// Safe version that returns null instead of throwing
export const useFirebaseSafe = (): FirebaseContextType | null => {
  const ctx = useContext(FirebaseContext);
  return ctx;
};

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseInstances, setFirebaseInstances] = useState<FirebaseContextType | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  // Error state removed as it's not currently used

  // Use a state for the user to trigger FCM initialization
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setIsMounted(true);
    logger.debug('FirebaseProvider: Attempting to get Firebase instances');

    const initFirebase = async (): Promise<void> => {
      try {
        // Add a small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 100));

        const { app, firestore, auth, storage, rtdb, analytics, messaging } = getClientFirebase();

        // Check if Firebase is initialized
        if (!app) {
          console.warn('Firebase app not initialized, using mock instances');
          // Create mock instances for development
          setFirebaseInstances({
            app: null,
            firestore: null,
            db: null,
            user: null,
            auth: null,
            storage: null,
            rtdb: null,
            analytics: null,
            messaging: null
          });
          return;
        }

        setFirebaseInstances({
          app,
          firestore,
          db: firestore,
          user: null,
          auth,
          storage,
          rtdb,
          analytics,
          messaging
        });
        logger.debug('FirebaseProvider: Firebase instances successfully set');

        // Listen for auth state changes to get the user
        if (auth) {
          auth.onAuthStateChanged((currentUser) => {
            logger.debug('FirebaseProvider: Auth state changed', { user: currentUser?.uid || 'anonymous' });
            setUser(currentUser);
          });

          // Note: unsubscribe function not stored as cleanup is handled by component unmount
        }

      } catch (e) {
        const error = e as Error;
        console.warn('FirebaseProvider: Firebase initialization failed, using mock instances', error);
        // Use mock instances instead of failing
        setFirebaseInstances({
          app: null,
          firestore: null,
          db: null,
          user: null,
          auth: null,
          storage: null,
          rtdb: null,
          analytics: null,
          messaging: null
        });
      }
    };

    initFirebase();
  }, []);

  // Initialize FCM when user is available and not anonymous (disabled for debugging)
  const presenceManagerRef = useRef<unknown | null>(null);
  const fcmManagerRef = useRef<unknown | null>(null); // FCMManager | null
  const [contextValue, setContextValue] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    if (!firebaseInstances) return;

    // Create new context value with current user
    const newContextValue = {
      ...firebaseInstances,
      user,
      presenceManager: presenceManagerRef.current,
      fcmManager: fcmManagerRef.current
    };

    // Initialize FCM and PresenceManager for authenticated users

    if (user && !user.isAnonymous) {
      try {
        if (!fcmManagerRef.current) {
          const fcmManager = new FCMManager();
          fcmManager.initialize(user.uid).catch((err) => {
            logger.error('FirebaseProvider: FCM initialization failed', err as Error);
          });
          fcmManagerRef.current = fcmManager;
          newContextValue.fcmManager = fcmManager;
        }

        if (!presenceManagerRef.current) {
          const pm = createPresenceManager(user.uid);
          presenceManagerRef.current = pm;
          newContextValue.presenceManager = pm;
        }

        logger.debug('FirebaseProvider: FCM and PresenceManager initialized', { uid: user.uid });
      } catch (err) {
        logger.error('FirebaseProvider: Failed to initialize FCM/PresenceManager', err as Error);
      }
    } else {
      // Clean up when user logs out or becomes anonymous
      if (presenceManagerRef.current) {
        try {
          const pm = presenceManagerRef.current as { disconnect?: () => void; goOffline?: () => void };
          if (typeof pm.disconnect === 'function') {
            pm.disconnect();
          } else if (typeof pm.goOffline === 'function') {
            pm.goOffline();
          }
        } catch (err) {
          logger.error('FirebaseProvider: Error while cleaning up PresenceManager', err as Error);
        } finally {
          presenceManagerRef.current = null;
          newContextValue.presenceManager = null;
        }
      }
      if (fcmManagerRef.current) {
        fcmManagerRef.current = null;
        newContextValue.fcmManager = null;
      }
    }


    setContextValue(newContextValue);
  }, [user, firebaseInstances]);

  // Simplified loading logic - just wait for mount and instances
  if (!isMounted || !firebaseInstances) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-sm text-white/70 tracking-widest">ЗАГРУЗКА...</span>
        </div>
      </div>
    );
  }

  logger.debug('FirebaseProvider: Rendering children with FirebaseContext');
  return (
    <FirebaseContext.Provider value={contextValue || firebaseInstances}>
      {children}
    </FirebaseContext.Provider>
  );
}
