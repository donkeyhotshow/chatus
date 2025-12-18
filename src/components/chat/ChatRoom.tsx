"use client";

import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Room, UserProfile } from '@/lib/types';
import { ChatArea } from './ChatArea';
import { ProfileCreationDialog } from './ProfileCreationDialog';
import { MobileNavigation } from '../mobile/MobileNavigation';
import { ChatSidebar, ChatTab } from './ChatSidebar';
import { UserList } from './UserList';
import { ChatStats } from './ChatStats';
import { useRouter } from 'next/navigation';

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
import { AnimatePresence, motion } from 'framer-motion';

// Lazy load heavy components
const CollaborationSpace = lazy(() => import('./CollaborationSpace').then(m => ({ default: m.CollaborationSpace })));

const LoadingSpinner = ({ text }: { text: string }) => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 8000); // Show fallback after 8 seconds

    return () => clearTimeout(timer);
  }, []);

  if (showFallback) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white p-8">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-xl font-bold text-yellow-400">⚠️ Долгая загрузка</h2>
          <p className="text-neutral-300">
            Загрузка занимает больше времени, чем обычно. Возможные причины:
          </p>
          <ul className="list-disc list-inside text-neutral-400 space-y-1 text-sm">
            <li>Медленное интернет-соединение</li>
            <li>Проблемы с Firebase сервером</li>
            <li>Блокировка браузером</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition"
          >
            Перезагрузить страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono text-white/70 tracking-widest">{text}</span>
      </div>
    </div>
  );
};

export function ChatRoom({ roomId }: { roomId: string }) {
  const [activeTab, setActiveTab] = useState<ChatTab>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
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
    leaveRoom
  } = useRoomManager(roomId);

  // Handle mobile tab changes
  const handleTabChange = (tab: ChatTab) => {
    setActiveTab(tab);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Handle mobile back navigation
  const handleMobileBack = () => {
    if (isMobile && activeTab !== 'chat') {
      setActiveTab('chat');
    }
  };

  // Use both useDoc (for real-time updates) and useRoom (for validation)
  const roomDocRef = useMemo(() => {
    if (!firebaseContext || !firebaseContext.db) return null;
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
      if (!firebaseContext?.db || !firebaseContext?.auth || !firebaseContext?.storage) {
        return;
      }
      try {
        const chatService = getChatService(
          roomId,
          firebaseContext.db,
          firebaseContext.auth,
          firebaseContext.storage
        );
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
    joinRoom(user, false).catch(err => {
      const error = err as Error;
      const firebaseError = err as { code?: string };

      if (error.message?.includes('Permission denied') ||
        error.message?.includes('client is offline') ||
        firebaseError.code === 'permission-denied' ||
        firebaseError.code === 'unavailable') {
        return;
      }

      logger.error("Error joining room", error, { roomId, userId: user.id });
      toast({
        variant: 'destructive',
        title: 'Error joining room',
        description: error.message
      });
    });

    return () => {
      if (isDemoMode()) {
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

      // Disconnect RoomManager to prevent memory leaks and infinite singletons
      import('@/services/RoomManager').then(({ disconnectRoomManager }) => {
        disconnectRoomManager(roomId).catch(err => {
          logger.error("Error disconnecting RoomManager", err as Error, { roomId });
        });
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

  const handleLogout = useCallback(() => {
    localStorage.removeItem('chatUsername');
    router.push('/');
  }, [router]);

  const handleSettings = useCallback(() => {
    toast({ title: "Настройки", description: "Функционал в разработке" });
  }, [toast]);

  if (!firebaseContext) {
    return <LoadingSpinner text="INITIALIZING..." />;
  }

  if (isLoading) {
    return <LoadingSpinner text="ЗАГРУЗКА..." />;
  }

  if (userError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="max-w-md p-8 bg-neutral-900 rounded-xl border border-red-500/50">
          <h2 className="text-xl font-bold text-red-500 mb-4">⚠️ Ошибка подключения</h2>
          <p className="text-neutral-300 mb-4">
            Не удалось подключиться к серверу.
          </p>
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

  return (
    <div className="flex h-full w-full overflow-hidden bg-black text-white">
      {/* Sidebar - Hidden on mobile by default, but can be toggled */}
      {!isMobile && (
        <ChatSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
          onSettings={handleSettings}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {activeTab === 'chat' && (
              <ChatArea
                user={user}
                roomId={roomId}
                isCollabSpaceVisible={false}
                onToggleCollaborationSpace={() => handleTabChange('canvas')}
                onMobileBack={handleMobileBack}
              />
            )}

            {(activeTab === 'canvas' || activeTab === 'games') && (
              <Suspense fallback={<LoadingSpinner text="LOADING..." />}>
                <CollaborationSpace
                  isVisible={true}
                  roomId={roomId}
                  user={user}
                  otherUser={otherUser}
                  allUsers={room?.participantProfiles || []}
                  mobileActiveTab={activeTab === 'canvas' ? 'canvas' : 'games'}
                />
              </Suspense>
            )}

            {activeTab === 'users' && (
              <div className="flex-1 p-6 overflow-y-auto">
                <UserList users={room?.participantProfiles || []} currentUserId={user.id} />
              </div>
            )}

            {activeTab === 'stats' && (
              <ChatStats
                messageCount={0}
                userCount={room?.participantProfiles?.length || 0}
                timeInChat="12м"
              />
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation
          activeTab={activeTab === 'canvas' ? 'canvas' : activeTab === 'games' ? 'games' : activeTab === 'users' ? 'users' : 'chat'}
          onTabChange={(tab) => handleTabChange(tab as ChatTab)}
          isCollabSpaceVisible={activeTab !== 'chat'}
          onToggleCollabSpace={() => handleTabChange(activeTab === 'chat' ? 'canvas' : 'chat')}
        />
      )}
    </div>
  );
}
