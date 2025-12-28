/**
 * React Query hooks для ромнатами чата
 * Обеспечивает кэширование и оптимистичные обновления
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirestore } from '@/lib/firebase-lazy';

export interface Room {
  id: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  memberCount: number;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  type: 'text' | 'image' | 'file' | 'system';
  reactions?: Record<string, string[]>;
}

// Получение списка комнат
export function useRoomsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: async () => {
      const db = await getFirestore();
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, orderBy('updatedAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 минуты
  });
}

// Получение конкретной комнаты
export function useRoomQuery(roomId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.room(roomId || ''),
    queryFn: async () => {
      if (!roomId) return null;
      const db = await getFirestore();
      const roomRef = doc(db, 'rooms', roomId);
      const snapshot = await getDoc(roomRef);

      if (!snapshot.exists()) return null;

      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Room;
    },
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000,
  });
}

// Получение сообщений комнаты
export function useRoomMessagesQuery(roomId: string | undefined, messageLimit = 50) {
  return useQuery({
    queryKey: [...queryKeys.roomMessages(roomId || ''), messageLimit],
    queryFn: async () => {
      if (!roomId) return [];
      const db = await getFirestore();
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse() as Message[];
    },
    enabled: !!roomId,
    staleTime: 30 * 1000, // 30 секунд для сообщений
  });
}

// Мутация для отправки сообщения
export function useSendMessageMutation(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, senderId, senderName }: {
      text: string;
      senderId: string;
      senderName: string;
    }) => {
      const db = await getFirestore();
      const messagesRef = collection(db, 'rooms', roomId, 'messages');

      const newMessage = {
        text,
        senderId,
        sme,
        timestamp: serverTimestamp(),
        type: 'text' as const,
      };

      const docRef = await addDoc(messagesRef, newMessage);

      // Обновляем lastMessage в комнате
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        lastMessage: {
          text,
          senderId,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, ...newMessage };
    },
    // Оптимистичное обновление
    onMutate: async ({ text, senderId, senderName }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.roomMessages(roomId) });

      const previousMessages = queryClient.getQueryData(queryKeys.roomMessages(roomId));

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        text,
        senderId,
        senderName,
        timestamp: Timestamp.now(),
        type: 'text',
      };

      queryClient.setQueryData(
        queryKeys.roomMessages(roomId),
        (old: Message[] | undefined) => [...(old || []), optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.roomMessages(roomId), context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roomMessages(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
}

// Мутация для создания комнаты
export function useCreateRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description, createdBy }: {
      name: string;
      description?: string;
      createdBy: string;
    }) => {
      const db = await getFirestore();
      const roomsRef = collection(db, 'rooms');

      const newRoom = {
        name,
        description: description || '',
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberCount: 1,
      };

      const docRef = await addDoc(roomsRef, newRoom);
      return { id: docRef.id, ...newRoom };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
}
