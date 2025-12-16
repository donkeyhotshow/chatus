
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
        const { app, firestore, auth, storage, rtdb, analytics, messaging } = getClientFirebase();

        // Check if Firebase is initialized
        if (!app) {
          setInitError('Firebase app not initialized');
          logger.error('FirebaseProvider: Firebase app not initialized');
          return;
        }

        if (!firestore) {
          setInitError('Firestore not initialized');
          logger.error('FirebaseProvider: Firestore not initialized');
          return;
        }

        if (!auth) {
          setInitError('Firebase Auth not initialized');
          logger.error('FirebaseProvider: Firebase Auth not initialized');
          urn;
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
          logger.debug('FirebaseProvider: Auth state changed', { user: currentUser?.uid || 'anonymous' });
          setUser(currentUser);
        });

        return () => unsubscribe();

      } catch (e) {
        const error = e as Error;
        setInitError(error.message);
        logger.error('FirebaseProvider: Failed to get Firebase instances', error);
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

  if (!isMounted) {
    logger.debug('FirebaseProvider: Not mounted, showing loading UI');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-white/70 tracking-widest">ЗАГРУЗКА...</span>
        </div>
      </div>
    );
  }

  if (initError) {
    logger.error('FirebaseProvider: Initialization error, showing error UI');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="text-center p-8 max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Ошибка инициализации</h1>
            <p className="text-gray-400 mb-4">
              {initError}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
          >
            Перезагрузить страницу
          </button>
        </div>
      </div>
    );
  }

  if (!firebaseInstances) {
    logger.debug('FirebaseProvider: Instances not ready, showing loading UI');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-white/70 tracking-widest">ИНИЦИАЛИЗАЦИЯ...</span>
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
