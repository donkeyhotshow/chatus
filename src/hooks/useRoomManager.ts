/**
 * useRoomManager - хук для работы с RoomManager
 * 
 * Предоставляет удобный интерфейс для работы с комнатой через RoomManager
 * Автоматически управляет подписками и очисткой ресурсов
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getRoomManager, 
  disconnectRoomManager,
  type RoomManager,
  type RoomManagerState 
} from '../services/RoomManager';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import type { UserProfile, Message, GameState } from '../lib/types';
import { logger } from '@/lib/logger';

export interface UseRoomManagerReturn {
  // Состояние
  state: RoomManagerState;
  
  // Методы
  joinRoom: (user: UserProfile, validateRoom?: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendMessage: (
    messageData: Omit<Message, 'id' | 'createdAt' | 'reactions' | 'readBy'>,
    clientMessageId?: string
  ) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string, user: UserProfile) => Promise<void>;
  setTypingStatus: (username: string, isTyping: boolean) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
  updateGameState: (gameId: string, newState: Partial<GameState>) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  createCanvasSheet: (name: string) => Promise<any>;
  saveCanvasPath: (pathData: Omit<import('../lib/types').CanvasPath, 'id' | 'createdAt'>) => Promise<void>;
  clearCanvasSheet: (sheetId: string) => Promise<void>;
  
  // Прямой доступ к RoomManager (для расширенного использования)
  roomManager: RoomManager | null;
  
  // Флаги состояния
  isLoading: boolean;
  isConnected: boolean;
}

/**
 * Хук для работы с RoomManager
 * 
 * @param roomId - ID комнаты
 * @returns Объект с состоянием и методами для работы с комнатой
 */
export function useRoomManager(roomId: string): UseRoomManagerReturn {
  const firebaseContext = useFirebase();
  const [roomManager, setRoomManager] = useState<RoomManager | null>(null);
  const [state, setState] = useState<RoomManagerState>({
    room: null,
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    gameStates: {},
    hasMoreMessages: true,
    isInitialLoad: true,
    isConnected: false,
  });

  // Инициализация RoomManager
  useEffect(() => {
    if (!firebaseContext?.db || !firebaseContext?.auth || !firebaseContext?.storage) {
      return;
    }

    const manager = getRoomManager(
      roomId,
      firebaseContext.db,
      firebaseContext.auth,
      firebaseContext.storage
    );
    
    setRoomManager(manager);

    // Подписка на изменения состояния
    const unsubscribe = manager.subscribe(() => {
      setState(manager.getState());
    });

    // Инициализация состояния
    setState(manager.getState());

    // Очистка при размонтировании или смене roomId
    return () => {
      unsubscribe();
      // Не отключаем RoomManager при размонтировании компонента,
      // так как он может быть переиспользован другими компонентами.
      // RoomManager управляется как singleton и очищается только при явном вызове disconnectRoomManager.
      // Это предотвращает потерю состояния при быстром переключении между комнатами.
    };
  }, [roomId, firebaseContext]);

  // Методы-обертки для удобства использования
  const joinRoom = useCallback(async (user: UserProfile, validateRoom: boolean = false) => {
    if (!roomManager) return;
    await roomManager.joinRoom(user, validateRoom);
  }, [roomManager]);

  const leaveRoom = useCallback(async () => {
    if (!roomManager) return;
    await roomManager.leaveRoom();
  }, [roomManager]);

  const sendMessage = useCallback(async (
    messageData: Omit<Message, 'id' | 'createdAt' | 'reactions' | 'readBy'>,
    clientMessageId?: string
  ) => {
    if (!roomManager) return;
    await roomManager.sendMessage(messageData, clientMessageId);
  }, [roomManager]);

  const loadMoreMessages = useCallback(async () => {
    if (!roomManager) return;
    await roomManager.loadMoreMessages();
  }, [roomManager]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!roomManager) return;
    await roomManager.deleteMessage(messageId);
  }, [roomManager]);

  const toggleReaction = useCallback(async (
    messageId: string,
    emoji: string,
    user: UserProfile
  ) => {
    if (!roomManager) return;
    await roomManager.toggleReaction(messageId, emoji, user);
  }, [roomManager]);

  const setTypingStatus = useCallback(async (username: string, isTyping: boolean) => {
    if (!roomManager) return;
    await roomManager.setTypingStatus(username, isTyping);
  }, [roomManager]);

  const uploadImage = useCallback(async (file: File) => {
    if (!roomManager) throw new Error('RoomManager not initialized');
    return roomManager.uploadImage(file);
  }, [roomManager]);

  const updateGameState = useCallback(async (gameId: string, newState: Partial<GameState>) => {
    if (!roomManager) return;
    await roomManager.updateGameState(gameId, newState);
  }, [roomManager]);

  const deleteGame = useCallback(async (gameId: string) => {
    if (!roomManager) return;
    await roomManager.deleteGame(gameId);
  }, [roomManager]);

  const createCanvasSheet = useCallback(async (name: string) => {
    if (!roomManager) throw new Error('RoomManager not initialized');
    return roomManager.createCanvasSheet(name);
  }, [roomManager]);

  const saveCanvasPath = useCallback(async (
    pathData: Omit<import('../lib/types').CanvasPath, 'id' | 'createdAt'>
  ) => {
    if (!roomManager) return;
    await roomManager.saveCanvasPath(pathData);
  }, [roomManager]);

  const clearCanvasSheet = useCallback(async (sheetId: string) => {
    if (!roomManager) return;
    await roomManager.clearCanvasSheet(sheetId);
  }, [roomManager]);

  return {
    state,
    joinRoom,
    leaveRoom,
    sendMessage,
    loadMoreMessages,
    deleteMessage,
    toggleReaction,
    setTypingStatus,
    uploadImage,
    updateGameState,
    deleteGame,
    createCanvasSheet,
    saveCanvasPath,
    clearCanvasSheet,
    roomManager,
    isLoading: state.isInitialLoad,
    isConnected: state.isConnected,
  };
}

