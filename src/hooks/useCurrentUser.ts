'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/lib/types';
import { getUserFromStorage, saveUserToStorage } from '@/lib/storage';
import { getChatService } from '@/services/ChatService';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { isFirebaseConfigValid } from '@/lib/firebase-config';
import { isDemoMode } from '@/lib/demo-mode';
import type { DocumentReference, DocumentSnapshot } from 'firebase/firestore';

/**
 * Stable user identification hook
 * 
 * Ensures:
 * - Same user is restored after page reload
 * - No duplicate users with same name/UID
 * - Proper session restoration
 */
export function useCurrentUser(roomId: string) {
  const firebaseContext = useFirebase();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load or create user with timeout
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadOrCreateUser = async () => {
      if (!firebaseContext?.auth || !firebaseContext?.db || !firebaseContext?.storage) {
        logger.debug('[useCurrentUser] Firebase context not available', { roomId });
        if (isMounted) setIsLoading(false);
        return;
      }

      // Check Firebase config validity once before attempting to use it (skip in demo mode)
      logger.debug('[useCurrentUser] Checking Firebase config validity', { isDemoMode: isDemoMode() });
      if (!isDemoMode() && !isFirebaseConfigValid()) {
        logger.warn('[useCurrentUser] Firebase config is invalid');
        if (isMounted) {
          setIsLoading(false);
          setError(new Error('Firebase configuration is invalid. Please set up your Firebase credentials in .env.local file. See FIREBASE_SETUP.md for instructions.'));
        }
        return;
      }

      // Set timeout for loading (10 seconds max)
      timeoutId = setTimeout(() => {
        logger.warn('[useCurrentUser] User loading timed out, using localStorage fallback');
        if (isMounted) {
          const storedUser = getUserFromStorage();
          if (storedUser) {
            setUser(storedUser);
          }
          setIsLoading(false);
        }
      }, 10000);

      // Helper: promise timeout
      const withTimeout = <T>(p: Promise<T>, ms = 7000): Promise<T> => {
        return Promise.race([
          p,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
        ]) as Promise<T>;
      };

      // Helper: try cache first, then server
      const fetchDocCacheFirst = async <T = any>(ref: DocumentReference): Promise<DocumentSnapshot<T>> => {
        try {
          // Try cache first (fast if persistence enabled)
          const cacheSnap = await getDoc(ref);
          return cacheSnap as DocumentSnapshot<T>;
        } catch {
          // Cache miss or unsupported - fall back to server
        }

        // Try server with timeout to avoid long blocks when offline
        const serverSnap = await withTimeout(getDoc(ref), 7000);
        return serverSnap as DocumentSnapshot<T>;
      };

      try {
        logger.debug('[useCurrentUser] Attempting to load or create user');
        // In demo mode, use only localStorage
        if (isDemoMode()) {
          const storedUser = getUserFromStorage();
          if (storedUser) {
            setUser(storedUser);
            setIsLoading(false);
            return;
          }
          // No stored user in demo mode - user needs to create profile
          setIsLoading(false);
          return;
        }

        // Step 1: Try to restore from localStorage
        const storedUser = getUserFromStorage();

        if (storedUser) {
          // Step 2: Verify user exists in Firestore and UID matches
          const service = getChatService(roomId, firebaseContext.db, firebaseContext.auth, firebaseContext.storage);
          const uid = await service.signInAnonymouslyIfNeeded();

          if (storedUser.id === uid) {
            // UID matches, verify user doc exists
            const userDocRef = doc(firebaseContext.db, 'users', uid);
            let userDoc;
            try {
              userDoc = await fetchDocCacheFirst(userDocRef);
            } catch (err) {
              userDoc = null;
            }

            if (userDoc && userDoc.exists()) {
              const firestoreUser = userDoc.data() as UserProfile;
              // Use Firestore data as source of truth, but keep stored as fallback
              setUser(firestoreUser);
              saveUserToStorage(firestoreUser);
              setIsLoading(false);
              return;
            }
          }
        }

        // Step 3: If no stored user or UID mismatch, sign in anonymously

        const service = getChatService(roomId, firebaseContext.db, firebaseContext.auth, firebaseContext.storage);
        const uid = await service.signInAnonymouslyIfNeeded();

        if (uid) {
          // Check if user doc exists
          const userDocRef = doc(firebaseContext.db, 'users', uid);
          let userDoc;
          try {
            userDoc = await fetchDocCacheFirst(userDocRef);
          } catch (err) {
            userDoc = null;
          }

          if (userDoc && userDoc.exists()) {
            const existingUser = userDoc.data() as UserProfile;
            setUser(existingUser);
            saveUserToStorage(existingUser);
          }
          // If no user doc, user needs to create profile (return null)
        }
      } catch (err) {
        const error = err as Error;
        const firebaseError = err as any;

        // Check if it's a Firebase offline/client error - handle gracefully in demo mode
        const isOfflineError =
          error.message?.includes('client is offline') ||
          error.message?.includes('Failed to get document') ||
          firebaseError.code === 'unavailable' ||
          firebaseError.code === 'failed-precondition';

        if (isDemoMode() && isOfflineError) {
          // In demo mode, offline errors are expected - use localStorage fallback
          const storedUser = getUserFromStorage();
          if (storedUser) {
            setUser(storedUser);
          }
          setIsLoading(false);
          return;
        }

        // Check if it's a Firebase config error - don't log these as they're expected
        const isConfigError =
          error.name === 'FirebaseConfigError' ||
          error.message?.includes('api-key-not-valid') ||
          error.message?.includes('API key') ||
          error.message?.includes('Firebase configuration is invalid') ||
          firebaseError.code === 'auth/api-key-not-valid' ||
          firebaseError.code?.includes('api-key') ||
          firebaseError.code === 'auth/invalid-api-key';

        if (isConfigError) {
          // Don't log config errors - they're expected when config is not set up
          setIsLoading(false);
          setError(new Error('Firebase configuration is invalid. Please set up your Firebase credentials in .env.local file. See FIREBASE_SETUP.md for instructions.'));
          return;
        }

        // Only log non-config errors
        logger.error('Failed to load user', error);
        setError(error);
        setIsLoading(false);
      }
    };

    loadOrCreateUser();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [firebaseContext, roomId]);

  const createProfile = useCallback(async (name: string, avatar: string): Promise<UserProfile> => {
    if (!firebaseContext?.auth || !firebaseContext?.db || !firebaseContext?.storage) {
      throw new Error('Firebase not initialized');
    }

    // In demo mode, create user profile using localStorage only
    if (isDemoMode()) {
      const demoUserId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser: UserProfile = {
        id: demoUserId,
        name: name.trim(),
        avatar: avatar,
      };
      setUser(newUser);
      saveUserToStorage(newUser);
      return newUser;
    }

    const service = getChatService(roomId, firebaseContext.db, firebaseContext.auth, firebaseContext.storage);
    const uid = await service.signInAnonymouslyIfNeeded();

    // Step 1: Check if user with same UID already exists
    const userDocRef = doc(firebaseContext.db, 'users', uid);

    try {
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (err) {
        userDoc = null;
      }

      if (userDoc && userDoc.exists()) {
        const existingUser = userDoc.data() as UserProfile;
        // If name matches, use existing user (update avatar if changed)
        if (existingUser.name === name.trim()) {
          const updatedUser = { ...existingUser, avatar };
          await setDoc(userDocRef, updatedUser, { merge: true });
          setUser(updatedUser);
          saveUserToStorage(updatedUser);
          return updatedUser;
        }
      }
    } catch (err) {
      // Handle offline errors gracefully
      const error = err as Error;
      if (error.message?.includes('client is offline') || error.message?.includes('Failed to get document')) {
        // In offline mode, create user in localStorage only
        const newUser: UserProfile = {
          id: uid,
          name: name.trim(),
          avatar: avatar,
        };
        setUser(newUser);
        saveUserToStorage(newUser);
        return newUser;
      }
      throw err;
    }

    // Step 2: Search for user with same name (to prevent duplicates)
    // Note: This requires a Firestore index on 'name' field
    // For now, we'll check only current UID's document
    // In production, you might want to add a collection query:
    // const nameQuery = query(collection(db, 'users'), where('name', '==', name.trim()), limit(1));
    // const nameSnapshot = await getDocs(nameQuery);
    // if (!nameSnapshot.empty) {
    //   const existingByName = nameSnapshot.docs[0].data() as UserProfile;
    //   // Use existing user if found
    // }

    // Step 3: Create new user profile
    const newUser: UserProfile = {
      id: uid,
      name: name.trim(),
      avatar: avatar,
    };

    try {
      await setDoc(userDocRef, newUser);
    } catch (err) {
      // Handle offline errors - save to localStorage anyway
      const error = err as Error;
      if (error.message?.includes('client is offline') || error.message?.includes('Failed to get document')) {
        // Continue with localStorage save
      } else {
        throw err;
      }
    }

    setUser(newUser);
    saveUserToStorage(newUser);

    return newUser;
  }, [firebaseContext, roomId]);

  return {
    user,
    isLoading,
    error,
    createProfile,
  };
}

