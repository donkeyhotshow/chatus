
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
  presenceManager?: any | null;
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

  // Use a state for the user to trigger FCM initialization
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setIsMounted(true);
    logger.debug('FirebaseProvider: Attempting to get Firebase instances');

    try {
      const { app, firestore, auth, storage, rtdb, analytics, messaging } = getClientFirebase();

      // Only set instances if Firebase is actually initialized
      if (!app || !firestore || !auth) {
        logger.warn('FirebaseProvider: Firebase not initialized (likely build time)');
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
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
      });

      return () => unsubscribe();

    } catch (e) {
      logger.error('FirebaseProvider: Failed to get Firebase instances', e as Error);
    }
  }, []);

  // Initialize FCM when user is available and not anonymous
  useEffect(() => {
    if (user && !user.isAnonymous && firebaseInstances) {
      const fcmManager = new FCMManager();
      fcmManager.initialize(user.uid);
      // store manager for consumers
      firebaseInstances.fcmManager = fcmManager;
      setFirebaseInstances({ ...firebaseInstances });
    }
  }, [user, firebaseInstances]);

  // Initialize PresenceManager when user logs in (non-anonymous)
  const presenceManagerRef = useRef<any | null>(null);
  const fcmManagerRef = useRef<FCMManager | null>(null);
  useEffect(() => {
    if (!firebaseInstances) return;

    if (user && !user.isAnonymous) {
      try {
        const pm = createPresenceManager(user.uid);
        presenceManagerRef.current = pm;
        logger.debug('FirebaseProvider: PresenceManager initialized', { uid: user.uid });
      } catch (err) {
        logger.error('FirebaseProvider: Failed to initialize PresenceManager', err as Error);
      }
    } else {
      // user logged out or anonymous - ensure cleanup of previous manager
      if (presenceManagerRef.current) {
        try {
          // prefer disconnect if available, otherwise goOffline
          if (typeof presenceManagerRef.current.disconnect === 'function') {
            presenceManagerRef.current.disconnect();
          } else if (typeof presenceManagerRef.current.goOffline === 'function') {
            presenceManagerRef.current.goOffline();
          }
        } catch (err) {
          logger.error('FirebaseProvider: Error while cleaning up PresenceManager', err as Error);
        } finally {
          presenceManagerRef.current = null;
        }
      }
    }

    // no explicit cleanup here since createPresenceManager registers unload cleanup
  }, [user, firebaseInstances]);

  // Expose presence and fcm managers in FirebaseContext
  useEffect(() => {
    if (!firebaseInstances) return;
    const inst = { ...firebaseInstances };
    inst.presenceManager = presenceManagerRef.current;
    if (fcmManagerRef.current) inst.fcmManager = fcmManagerRef.current;
    inst.user = user;
    setFirebaseInstances(inst);
  }, [presenceManagerRef.current, fcmManagerRef.current, firebaseInstances]);

  if (!isMounted || !firebaseInstances) {
    logger.debug('FirebaseProvider: Not mounted or instances not ready, showing fallback UI');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-white/70 tracking-widest">INITIALIZING...</span>
        </div>
      </div>
    );
  }

  logger.debug('FirebaseProvider: Rendering children with FirebaseContext');
  return (
    <FirebaseContext.Provider value={firebaseInstances}>
      {children}
    </FirebaseContext.Provider>
  );
}
