
"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { getFirebase } from '@/lib/firebase';

interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const useFirebase = () => {
  // We return the context directly. It can be null if Firebase is not initialized yet.
  return useContext(FirebaseContext);
};

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseInstances, setFirebaseInstances] = useState<FirebaseContextType | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const sanitizeFetchEnabled = process.env.NEXT_PUBLIC_EXPERIMENTAL_FETCH_SANITIZE === 'true';
  
  useEffect(() => {
    setIsMounted(true);
    console.log('[DEBUG] FirebaseProvider: Attempting to get Firebase instances...');
    // Optional experimental fetch sanitization (default off)
    if (sanitizeFetchEnabled) {
    try {
      if (typeof window !== 'undefined' && 'fetch' in window) {
        const globalAny: any = window;
        if (!globalAny.__fetch_sanitized__) {
          const originalFetch = globalAny.fetch.bind(globalAny);
          globalAny.fetch = async (input: RequestInfo, init?: RequestInit) => {
            try {
              if (typeof input === 'string') {
                input = input.replace(/%0D%0A/g, '').replace(/\\r\\n/g, '');
              } else if (input instanceof Request) {
                const url = input.url.replace(/%0D%0A/g, '').replace(/\\r\\n/g, '');
                input = new Request(url, input);
              }
            } catch (e) {
              // ignore
            }
            return originalFetch(input, init);
          };
          globalAny.__fetch_sanitized__ = true;
            console.debug('[DEBUG] Global fetch monkey-patched to sanitize URLs (experimental flag enabled).');
        }
      }
    } catch (e) {
      console.debug('[DEBUG] Failed to patch fetch', e);
      }
    }
    // The getFirebase function handles the singleton pattern for us.
    const instances = getFirebase();
    if (instances) {
        setFirebaseInstances(instances);
        console.log('[DEBUG] FirebaseProvider: Firebase instances successfully set.');
        if (sanitizeFetchEnabled) {
        // If runtime app.options contain unexpected characters (CR/LF) or mismatch with sanitized config,
        // try to unregister service workers to force clients to load a fresh copy (cache-bust).
        try {
          const runtimeProjectId = (instances.app as any).options?.projectId;
          const runtimeAuthDomain = (instances.app as any).options?.authDomain;
          const sanitizedProjectId = String(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim().replace(/[\r\n]+/g, '');
          const sanitizedAuthDomain = String(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '').trim().replace(/[\r\n]+/g, '');
          const hasCRLFInRuntime = /[\\r\\n]/.test(String(runtimeProjectId || '')) || /[\\r\\n]/.test(String(runtimeAuthDomain || ''));
          const mismatch = runtimeProjectId !== sanitizedProjectId || runtimeAuthDomain !== sanitizedAuthDomain;
          if ((hasCRLFInRuntime || mismatch) && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            console.warn('[WARN] Detected runtime env mismatch or CRLF in app.options. Unregistering service workers to force refresh.');
            navigator.serviceWorker.getRegistrations().then(regs => {
              regs.forEach(r => r.unregister());
              // Give browser a moment then reload
              setTimeout(() => window.location.reload(), 500);
            }).catch(e => {
              console.error('[ERROR] Failed to unregister service workers', e);
            });
          }
        } catch (e) {
          // ignore
        }
        }
    } else {
        console.error('[ERROR] FirebaseProvider: Failed to get Firebase instances.');
    }
  }, []);

  // Prevent hydration mismatch by rendering the same on server and client initially
  if (!isMounted || !firebaseInstances) {
    console.log('[DEBUG] FirebaseProvider: Not mounted or instances not ready, showing fallback UI.');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-white/70 tracking-widest">INITIALIZING...</span>
        </div>
      </div>
    );
  }

  console.log('[DEBUG] FirebaseProvider: Rendering children with FirebaseContext.');
  return (
    <FirebaseContext.Provider value={firebaseInstances}>
      {children}
    </FirebaseContext.Provider>
  );
}
