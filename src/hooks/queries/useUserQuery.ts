/**
 * React Query hooks длты с пользователями
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { serverTimestamp } from 'firebase/firestore';
import { getFirestoreLazy } from '@/lib/firebase-lazy';

export interface User {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  createdAt: Date;
  lastSeen?: Date;
  status?: 'online' | 'offline' | 'away';
  bio?: string;
}

// Получение пользователя по ID
export function useUserQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      const { getFirestore, doc, getDoc } = await getFirestoreLazy();
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) return null;

      return {
        id: snapshot.id,
        ...snapshot.data()
      } as User;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 минут
  });
}

// Получение текущего пользователя
export function useCurrentUserQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async () => {
      if (!userId) return null;
      const { getFirestore, doc, getDoc } = await getFirestoreLazy();
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) return null;

      return {
        id: snapshot.id,
        ...snapshot.data()
      } as User;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// Мутация для обновления профиля
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: {
      userId: string;
      updates: Partial<Pick<User, 'displayName' | 'photoURL' | 'bio'>>;
    }) => {
      const { getFirestore, doc, updateDoc } = await getFirestoreLazy();
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);

      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return { userId, ...updates };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user(data.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    },
  });
}

// Мутация для обновления статуса присутствия
export function useUpdatePresenceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: {
      userId: string;
      status: 'online' | 'offline' | 'away';
    }) => {
      const { getFirestore, doc, updateDoc } = await getFirestoreLazy();
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);

      await updateDoc(userRef, {
        status,
        lastSeen: serverTimestamp(),
      });

      return { userId, status };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.userPresence(data.userId),
        { status: data.status, lastSeen: new Date() }
      );
    },
  });
}
