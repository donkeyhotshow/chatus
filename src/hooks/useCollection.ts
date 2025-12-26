"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { onSnapshot, Query, FirestoreError, DocumentReference, getDoc, getDocs } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { isDemoMode } from '@/lib/demo-mode';

interface UseCollectionOptions {
  listen?: boolean;
}

// Stable query comparison helper
function areQueriesEqual(a: Query | null, b: Query | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  // Compare query paths as a simple equality check
  try {
    return a.toString() === b.toString();
  } catch {
    return false;
  }
}

export function useCollection<T>(
  query: Query | null,
  options: UseCollectionOptions = { listen: true }
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Use ref to track previous query for stable comparison
  const prevQueryRef = useRef<Query | null>(null);
  const queryChanged = !areQueriesEqual(query, prevQueryRef.current);

  // Update ref when query actually changes
  useEffect(() => {
    if (queryChanged) {
      prevQueryRef.current = query;
    }
  }, [query, queryChanged]);

  // Memoize the query to prevent re-renders from creating new query objects
  const memoizedQuery = useMemo(() => query, [queryChanged ? query : prevQueryRef.current]);

  // Stable error handler
  const handleError = useCallback((err: FirestoreError) => {
    // In demo mode, suppress offline errors
    if (isDemoMode() && (err.message?.includes('client is offline') || err.message?.includes('Failed to get document') || err.code === 'unavailable')) {
      setLoading(false);
      setData([]);
      return;
    }
    logger.error("useCollection error", err as Error);
    setError(err);
    setLoading(false);
  }, []);

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
        handleError
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
        .catch(handleError);
    }
  }, [memoizedQuery, options.listen, handleError]);

  return { data, loading, error };
}

interface UseDocOptions {
  listen?: boolean;
}

// Stable ref comparison helper
function areRefsEqual(a: DocumentReference | null, b: DocumentReference | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return a.path === b.path;
  } catch {
    return false;
  }
}

export function useDoc<T>(
  ref: DocumentReference | null,
  options: UseDocOptions = { listen: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Use ref to track previous reference for stable comparison
  const prevRefRef = useRef<DocumentReference | null>(null);
  const refChanged = !areRefsEqual(ref, prevRefRef.current);

  // Update ref when reference actually changes
  useEffect(() => {
    if (refChanged) {
      prevRefRef.current = ref;
    }
  }, [ref, refChanged]);

  const memoizedRef = useMemo(() => ref, [refChanged ? ref : prevRefRef.current]);

  // Stable error handler
  const handleError = useCallback((err: FirestoreError) => {
    // In demo mode, suppress offline errors
    if (isDemoMode() && (err.message?.includes('client is offline') || err.message?.includes('Failed to get document') || err.code === 'unavailable')) {
      setLoading(false);
      setData(null);
      return;
    }
    logger.error("useDoc error", err as Error);
    setError(err);
    setLoading(false);
  }, []);

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
        handleError
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
        .catch(handleError);
    }
  }, [memoizedRef, options.listen, handleError]);

  return { data, loading, error };
}
