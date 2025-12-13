
"use client";

import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, Query, DocumentData, FirestoreError, DocumentReference, getDoc, getDocs } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { isDemoMode } from '@/lib/demo-mode';

interface UseCollectionOptions {
  listen?: boolean;
}

export function useCollection<T>(
  query: Query | null,
  options: UseCollectionOptions = { listen: true }
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Memoize the query to prevent re-renders from creating new query objects
  const memoizedQuery = useMemo(() => query, [query]);

  useEffect(() => {
    if (!memoizedQuery) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);

    if (options.listen) {
      const unsubscribe = onSnapshot(
        memoizedQuery,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
            } as T;
          });
          setData(docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          const error = err as any;
          // In demo mode, suppress offline errors
          if (isDemoMode() && (error.message?.includes('client is offline') || error.message?.includes('Failed to get document') || error.code === 'unavailable')) {
            setLoading(false);
            setData([]);
            return;
          }
          logger.error("useCollection error", err as Error);
          setError(err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      getDocs(memoizedQuery)
        .then((snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(docs);
          setLoading(false);
          setError(null);
        })
        .catch((err) => {
          const error = err as any;
          // In demo mode, suppress offline errors
          if (isDemoMode() && (error.message?.includes('client is offline') || error.message?.includes('Failed to get document') || error.code === 'unavailable')) {
            setLoading(false);
            setData([]);
            return;
          }
          logger.error("useCollection getDocs error", err as Error);
          setError(err);
          setLoading(false);
        });
    }
  }, [memoizedQuery, options.listen]);

  return { data, loading, error };
}

interface UseDocOptions {
  listen?: boolean;
}

export function useDoc<T>(
  ref: DocumentReference | null,
  options: UseDocOptions = { listen: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const memoizedRef = useMemo(() => ref, [ref]);

  useEffect(() => {
    if (!memoizedRef) {
      setLoading(false);
      setData(null);
      return;
    }
    
    setLoading(true);

    if (options.listen) {
      const unsubscribe = onSnapshot(
        memoizedRef,
        (doc) => {
          if (doc.exists()) {
            setData({ id: doc.id, ...doc.data() } as T);
          } else {
            setData(null);
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          const error = err as any;
          // In demo mode, suppress offline errors
          if (isDemoMode() && (error.message?.includes('client is offline') || error.message?.includes('Failed to get document') || error.code === 'unavailable')) {
            setLoading(false);
            setData(null);
            return;
          }
          logger.error("useDoc error", err as Error);
          setError(err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      getDoc(memoizedRef)
        .then((doc) => {
          if (doc.exists()) {
            setData({ id: doc.id, ...doc.data() } as T);
          } else {
            setData(null);
          }
          setLoading(false);
          setError(null);
        })
        .catch((err) => {
          const error = err as any;
          // In demo mode, suppress offline errors
          if (isDemoMode() && (error.message?.includes('client is offline') || error.message?.includes('Failed to get document') || error.code === 'unavailable')) {
            setLoading(false);
            setData(null);
            return;
          }
          logger.error("useDoc getDoc error", err as Error);
          setError(err);
          setLoading(false);
        });
    }
  }, [memoizedRef, options.listen]);

  return { data, loading, error };
}
