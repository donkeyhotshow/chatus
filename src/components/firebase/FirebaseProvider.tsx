
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
  fcmManager?: FCMManager | null;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const useFirebase = (): FirebaseContextType => {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error('useFirebase must be used within FirebaseProvider');
  return ctx;
};

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseInstances, setFirebaseInstances] = useState<FirebaseContextType | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Use a state for the user to trigger FCM initialization
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setIsMounted(true);
    logger.debug('FirebaseProvider: Attempting to get Firebase instances');

    const initFirebase = async () => {
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
          const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            logger.debug('FirebaseProvider: Auth state changed', { user: currentUser?.uid || 'anonymous' });
            setUser(currentUser);
          });

          return () => unsubscribe();
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
  const fcmManagerRef = useRef<FCMManager | null>(null);

  useEffect(() => {
    if (!firebaseInstances) return;

    // Update instances with current user
    const inst = { ...firebaseInstances };
    inst.user = user;
    setFirebaseInstances(inst);

    // Initialize FCM and PresenceManager for authenticated users
    if (user && !user.isAnonymous) {
      try {
        const fcmManager = new FCMManager();
        fcmManager.initialize(user.uid).catch((err) => {
          logger.error('FirebaseProvider: FCM initialization failed', err as Error);
        });
        inst.fcmManager = fcmManager;
        fcmManagerRef.current = fcmManager;

        const pm = createPresenceManager(user.uid);
        presenceManagerRef.current = pm;
        inst.presenceManager = pm;

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
        }
      }
    }
  }, [user, firebaseInstances]);

  // Simplified loading logic - just wait for mount and instances
  if (!isMounted || !firebaseInstances) {
    return null; // Return null to prevent hydration mismatch
  }

  logger.debug('FirebaseProvider: Rendering children with FirebaseContext');
  return (
    <FirebaseContext.Provider value={firebaseInstances}>
      {children}
    </FirebaseContext.Provider>
  );
}
