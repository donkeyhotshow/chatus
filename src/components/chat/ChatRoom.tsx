
"use client";

import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@/lib/types';
import { ChatArea } from './ChatArea';
import { ProfileCreationDialog } from './ProfileCreationDialog';

// Lazy load heavy components
const CollaborationSpace = lazy(() => import('./CollaborationSpace').then(m => ({ default: m.CollaborationSpace })));
import { useFirebase } from '../firebase/FirebaseProvider';
import { useDoc } from '@/hooks/useDoc';
import { doc } from 'firebase/firestore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePresence } from '@/hooks/usePresence';
import { useRoom } from '@/hooks/useRoom';
import { useRoomManager } from '@/hooks/useRoomManager';
import { logger } from '@/lib/logger';
import { isDemoMode } from '@/lib/demo-mode';
import { getChatService } from '@/services/ChatService';

const LoadingSpinner = ({ text }: { text: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-black">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      <span className="font-mono text-white/70 tracking-widest">{text}</span>
    </div>
  </div>
);

export function ChatRoom({ roomId }: { roomId: string }) {
  const [isCollabSpaceVisible, setIsCollabSpaceVisible] = useState(false);

  const { toast } = useToast();
  const firebaseContext = useFirebase();
  const isMobile = useIsMobile();

  // Use stable user identification hook
  const { user, isLoading, createProfile, error: userError } = useCurrentUser(roomId);
  const [isCreating, setIsCreating] = useState(false);

  // Use presence hook for online/offline status
  usePresence(roomId, user?.id || null);

  // Use room hook for validation and room data
  const { validate } = useRoom(roomId);

  // Use RoomManager for unified room management
  const {
    joinRoom,
    leaveRoom,
    isConnected,
    isLoading: isRoomManagerLoading
  } = useRoomManager(roomId);

  useEffect(() => {
    if (isMobile) {
      setIsCollabSpaceVisible(false);
    } else {
      setIsCollabSpaceVisible(true);
    }
  }, [isMobile]);

  // Use both useDoc (for real-time updates) and useRoom (for validation)
  const roomDocRef = useMemo(() => {
    if (!firebaseContext) return null;
    return doc(firebaseContext.db, 'rooms', roomId);
  }, [firebaseContext, roomId]);

  const { data: room, loading: roomLoading } = useDoc<Room>(roomDocRef);

  // Validate room existence on mount
  useEffect(() => {
    if (user && !roomLoading) {
      validate();
    }
  }, [user, roomLoading, validate]);

  // Join room using RoomManager (unified approach)
  useEffect(() => {
    if (!user) {
      return;
    }

    // In demo mode, join room directly via ChatService
    if (isDemoMode()) {
      // Firebase should be initialized even in demo mode (with dummy config)
      // But we need to wait for firebaseContext to be available
      if (!firebaseContext?.db || !firebaseContext?.auth || !firebaseContext?.storage) {
        logger.debug('[DEMO MODE] Waiting for Firebase context', { roomId, userId: user.id });
        return;
      }
      try {
        const chatService = getChatService(
          roomId,
          firebaseContext.db,
          firebaseContext.auth,
          firebaseContext.storage
        );
        logger.info('[DEMO MODE] Joining room via ChatService', { roomId, userId: user.id });
        chatService.joinRoom(user, false).catch(err => {
          logger.error("Error joining room in demo mode", err as Error, { roomId, userId: user.id });
        });
      } catch (err) {
        logger.error("Failed to get ChatService in demo mode", err as Error, { roomId, userId: user.id });
      }
      return;
    }

    if (!firebaseContext?.db || !firebaseContext?.auth || !firebaseContext?.storage) {
      return;
    }

    // Join room using RoomManager
    // validateRoom=false allows auto-creation for new rooms
    joinRoom(user, false).catch(err => {
      const error = err as Error;
      const firebaseError = err as any;

      // Suppress permission errors when offline
      if (error.message?.includes('Permission denied') ||
        error.message?.includes('client is offline') ||
        firebaseError.code === 'permission-denied' ||
        firebaseError.code === 'unavailable') {
        return; // Silently ignore
      }

      logger.error("Error joining room", error, { roomId, userId: user.id });
      toast({
        variant: 'destructive',
        title: 'Error joining room',
        description: error.message
      });
    });

    // Cleanup on unmount
    return () => {
      if (isDemoMode()) {
        // In demo mode, leave room via ChatService
        if (firebaseContext?.db && firebaseContext?.auth && firebaseContext?.storage) {
          const chatService = getChatService(
            roomId,
            firebaseContext.db,
            firebaseContext.auth,
            firebaseContext.storage
          );
          chatService.leaveRoom().catch(err => {
            logger.error("Error leaving room in demo mode", err as Error, { roomId });
          });
        }
        return;
      }
      leaveRoom().catch(err => {
        logger.error("Error leaving room", err as Error, { roomId });
      });
    };
  }, [user, roomId, joinRoom, leaveRoom, firebaseContext, toast]);

  const handleProfileCreate = async (username: string, avatar: string) => {
    try {
      setIsCreating(true);
      await createProfile(username, avatar);
    } catch (err) {
      logger.error('Could not create profile', err as Error, { username, roomId });
      toast({ title: 'Could not create profile', description: (err as Error).message, variant: 'destructive' });
      setIsCreating(false);
      throw err;
    }
  };

  if (!firebaseContext) {
    return <LoadingSpinner text="INITIALIZING..." />;
  }

  // Show Firebase config error if present (but not in demo mode)
  if (!isDemoMode() && userError && userError.message?.includes('Firebase configuration is invalid')) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white p-8">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-2xl font-bold text-red-400">🔥 Firebase Configuration Required</h1>
          <p className="text-neutral-300">
            Your Firebase configuration is missing or invalid. Please set up your Firebase credentials to use this application.
          </p>
          <div className="bg-neutral-900 p-4 rounded-lg space-y-2 text-sm font-mono">
            <p className="text-neutral-400">Quick fix:</p>
            <ol className="list-decimal list-inside space-y-1 text-neutral-200">
              <li>Open <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Firebase Console</a></li>
              <li>Get your project configuration (Project Settings → General → Your apps → Web app)</li>
              <li>Update <code className="bg-neutral-800 px-1 rounded">.env.local</code> file with real values</li>
              <li>Restart the dev server</li>
            </ol>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
            <p className="text-blue-300 text-sm font-semibold mb-2">💡 Для локального тестирования:</p>
            <p className="text-blue-200 text-xs">
              Добавьте <code className="bg-blue-900/50 px-1 rounded">NEXT_PUBLIC_DEMO_MODE=true</code> в <code className="bg-blue-900/50 px-1 rounded">.env.local</code> для работы без Firebase
            </p>
          </div>
          <p className="text-sm text-neutral-500">
            See <code className="bg-neutral-900 px-1 rounded">QUICK_FIX_FIREBASE.md</code> or <code className="bg-neutral-900 px-1 rounded">FIREBASE_SETUP.md</code> for detailed instructions.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner text="ЗАГРУЗКА..." />;
  }

  // Show error if Firebase Auth failed
  if (userError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="max-w-md p-8 bg-neutral-900 rounded-xl border border-red-500/50">
          <h2 className="text-xl font-bold text-red-500 mb-4">⚠️ Ошибка подключения</h2>
          <p className="text-neutral-300 mb-4">
            Не удалось подключиться к серверу. Проверьте:
          </p>
          <ul className="list-disc list-inside text-neutral-400 space-y-2 mb-6">
            <li>Включен ли Anonymous Auth в Firebase Console</li>
            <li>Добавлен ли домен в Authorized domains</li>
            <li>Интернет-соединение</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ProfileCreationDialog
        isOpen={true}
        onProfileCreate={handleProfileCreate}
        roomId={roomId}
        isCreating={isCreating}
      />
    );
  }

  if (roomLoading && !room) {
    return <LoadingSpinner text="CONNECTING..." />;
  }

  const otherUser = room?.participantProfiles?.find(p => p.id !== user?.id);
  const showChatArea = !isMobile || (isMobile && !isCollabSpaceVisible);

  return (
    <div className="flex h-full w-full">
      {user && showChatArea && (
        <ChatArea
          user={user}
          roomId={roomId}
          isCollabSpaceVisible={isCollabSpaceVisible}
          onToggleCollaborationSpace={() => setIsCollabSpaceVisible(v => !v)}
        />
      )}
      {user && (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-black"><div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div></div>}>
          <CollaborationSpace
            isVisible={isCollabSpaceVisible}
            roomId={roomId}
            user={user}
            otherUser={otherUser}
            allUsers={room?.participantProfiles || []}
          />
        </Suspense>
      )}
    </div>
  );
}
