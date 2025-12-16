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
        // Create new state object
        const newState = {
          messages: [...chatService.messages],
          onlineUsers: [...chatService.onlineUsers],
          typingUsers: [...chatService.typingUsers],
          gameStates: { ...chatService.gameStates },
          hasMoreMessages: chatService.hasMoreMessages,
          isInitialLoad: chatService.isInitialLoad,
        };

        // Always update if messages length changed (new message added/removed)
        if (prevState.messages.length !== newState.messages.length) {
          connectionManager.handleConnectionSuccess();
          return newState;
        }

        // If length is same, check if messages actually changed by comparing IDs
        const messagesChanged = prevState.messages.some((msg, idx) =>
          msg.id !== newState.messages[idx]?.id
        );

        // Also check other state changes
        const otherStateChanged =
          prevState.onlineUsers.length !== newState.onlineUsers.length ||
          prevState.typingUsers.length !== newState.typingUsers.length ||
          prevState.hasMoreMessages !== newState.hasMoreMessages ||
          prevState.isInitialLoad !== newState.isInitialLoad;

        // Always return new state if something changed
        if (messagesChanged || otherStateChanged) {
          connectionManager.handleConnectionSuccess();
          return newState;
        }

        // Return new state anyway to ensure React detects changes
        // This is safer than returning prevState which might prevent updates
        return newState;
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
