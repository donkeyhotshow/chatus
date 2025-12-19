'use client';
import { useState, useEffect } from 'react';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { logger } from '@/lib/logger';
import type { Message, UserProfile, GameState } from '../lib/types';
import { ChatService, getChatService } from '../services/ChatService';
import { useConnectionManager } from './useConnectionManager';

interface ChatState {
  messages: Message[];
  onlineUsers: UserProfile[];
  typingUsers: string[];
  gameStates: { [gameId: string]: GameState };
  hasMoreMessages: boolean;
  isInitialLoad: boolean;
}

export const useChatService = (roomId: string, currentUser?: UserProfile) => {
  const firebaseContext = useFirebase();
  const [service, setService] = useState<ChatService | null>(null);
  const [state, setState] = useState<ChatState>({
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    gameStates: {},
    hasMoreMessages: true,
    isInitialLoad: true,
  });

  // Connection manager for auto-reconnect and error handling
  const connectionManager = useConnectionManager({
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    onReconnect: async () => {
      if (service && currentUser) {
        await service.joinRoom(currentUser, false);
      }
    },
    onDisconnect: () => {
      if (service) {
        service.disconnect();
      }
    }
  });

  useEffect(() => {
    // In demo mode, Firebase context should still be available (with dummy config)
    if (!firebaseContext?.db || !firebaseContext?.auth || !firebaseContext?.storage) {
      logger.debug('[useChatService] Waiting for Firebase context', { roomId });
      return;
    }

    const chatService = getChatService(
      roomId,
      firebaseContext.db,
      firebaseContext.auth,
      firebaseContext.storage
    );
    setService(chatService);
    logger.debug('[useChatService] ChatService set', { roomId, hasService: !!chatService });

    // Note: joinRoom is called in ChatRoom component to avoid double calls
    // Do not call here to prevent race conditions

    const handleUpdate = () => {
      setState(prevState => {
        // Get current service state
        const currentMessages = chatService.messages;
        const currentOnlineUsers = chatService.onlineUsers;
        const currentTypingUsers = chatService.typingUsers;
        const currentGameStates = chatService.gameStates;
        const currentHasMoreMessages = chatService.hasMoreMessages;
        const currentIsInitialLoad = chatService.isInitialLoad;

        // Check if messages changed (most common case)
        const messagesChanged =
          prevState.messages.length !== currentMessages.length ||
          prevState.messages.some((msg, idx) => msg.id !== currentMessages[idx]?.id);

        // Check if other state changed
        const onlineUsersChanged =
          prevState.onlineUsers.length !== currentOnlineUsers.length ||
          prevState.onlineUsers.some((user, idx) => user.id !== currentOnlineUsers[idx]?.id);

        const typingUsersChanged =
          prevState.typingUsers.length !== currentTypingUsers.length ||
          prevState.typingUsers.some((userId, idx) => userId !== currentTypingUsers[idx]);

        const gameStatesChanged =
          Object.keys(prevState.gameStates).length !== Object.keys(currentGameStates).length ||
          Object.keys(currentGameStates).some(key =>
            prevState.gameStates[key] !== currentGameStates[key]
          );

        const hasMoreMessagesChanged = prevState.hasMoreMessages !== currentHasMoreMessages;
        const isInitialLoadChanged = prevState.isInitialLoad !== currentIsInitialLoad;

        // Only update if something actually changed
        if (messagesChanged || onlineUsersChanged || typingUsersChanged ||
          gameStatesChanged || hasMoreMessagesChanged || isInitialLoadChanged) {

          connectionManager.handleConnectionSuccess();

          return {
            messages: messagesChanged ? [...currentMessages] : prevState.messages,
            onlineUsers: onlineUsersChanged ? [...currentOnlineUsers] : prevState.onlineUsers,
            typingUsers: typingUsersChanged ? [...currentTypingUsers] : prevState.typingUsers,
            gameStates: gameStatesChanged ? { ...currentGameStates } : prevState.gameStates,
            hasMoreMessages: currentHasMoreMessages,
            isInitialLoad: currentIsInitialLoad,
          };
        }

        // No changes, return previous state
        return prevState;
      });
    };

    // Handle connection errors
    // const handleError = (error: Error) => {
    //   connectionManager.handleConnectionError(error);
    // };

    chatService.subscribe(handleUpdate);
    handleUpdate(); // Initial state

    return () => {
      chatService.unsubscribe(handleUpdate);
      // Note: Don't call disconnect() here as ChatService is singleton per room
      // Disconnect should only be called when explicitly leaving the room
      // Calling it here causes issues with fast room switching and state loss
    };
  }, [roomId, currentUser, firebaseContext, connectionManager]);

  return {
    ...state,
    service,
    connectionState: {
      isOnline: connectionManager.isOnline,
      isConnected: connectionManager.isConnected,
      isReconnecting: connectionManager.isReconnecting
    }
  };
};
