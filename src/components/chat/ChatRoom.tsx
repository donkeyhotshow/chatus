"use client";

import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@/lib/types';
import { ChatArea } from './ChatArea';
import { ProfileCreationDialog } from './ProfileCreationDialog';
import { MobileNavigation } from '../mobile/MobileNavigation';
import { ChatSidebar, ChatTab } from './ChatSidebar';
import { UserList } from './UserList';
import { ChatStats } from './ChatStats';
import { ConnectionStatus } from './ConnectionStatus';
import { SettingsPanel } from './SettingsPanel';
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
import { cn } from '@/lib/utils';
import { useSwipe } from '@/hooks/use-swipe';
import { OnboardingTour, useOnboarding } from './OnboardingTour';
import { ChatSkeleton } from './ChatSkeleton';
import { AnimatedTabTransition } from '../layout/AnimatedTabTransition';

// Lazy load heavy components
const CollaborationSpace = lazy(() => import('./CollaborationSpace').then(m => ({ default: m.CollaborationSpace })));

// Skeleton-based loading з fallback
function LoadingScreen({ text, showSkeleton = false }: { text: string; showSkeleton?: boolean }) {
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowFallback(true), 8000);
        return () => clearTimeout(timer);
    }, []);

    if (showFallback) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[var(--bg-primary)] p-6">
                <div className="max-w-sm text-center space-y-4">
                    <p className="text-[var(--text-secondary)]">
                        Загрузка занимает больше времени, чем обычно
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        Перезагрузить
                    </button>
                </div>
            </div>
        );
    }

    // Використовуємо skeleton для чату
    if (showSkeleton) {
        return <ChatSkeleton />;
    }

    return (
        <div className="flex h-full w-full items-center justify-center bg-[var(--bg-primary)]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--border-primary)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                <span className="text-sm text-[var(--text-muted)]">{text}</span>
            </div>
        </div>
    );
}

// Экран ошибки
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-[var(--bg-primary)] p-6">
            <div className="max-w-sm text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center">
                    <span className="text-2xl">!</span>
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Ошибка подключения
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                    Не удалось подключиться к серверу
                </p>
                <button
                    onClick={onRetry}
                    className="w-full py-3 bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                >
                    Попробовать снова
                </button>
            </div>
        </div>
    );
}

export function ChatRoom({ roomId }: { roomId: string }) {
    const [activeTab, setActiveTab] = useState<ChatTab>('chat');
    const [showSettings, setShowSettings] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const firebaseContext = useFirebase();
    const isMobile = useIsMobile();

    const { user, isLoading, createProfile, error: userError } = useCurrentUser(roomId);
    const [isCreating, setIsCreating] = useState(false);

    // Onboarding
    const { showOnboarding, completeOnboarding } = useOnboarding();

    usePresence(roomId, user?.id || null);
    const { validate } = useRoom(roomId);
    const { joinRoom, leaveRoom } = useRoomManager(roomId);

    const handleTabChange = useCallback((tab: ChatTab | string) => {
        setActiveTab(tab as ChatTab);
    }, []);

    const handleMobileBack = useCallback(() => {
        if (isMobile && activeTab !== 'chat') {
            setActiveTab('chat');
        }
    }, [isMobile, activeTab]);

    // Swipe gestures for mobile navigation
    const swipeHandlers = useSwipe({
        onSwipedLeft: () => {
            if (isMobile && activeTab === 'chat') {
                setActiveTab('canvas');
            } else if (isMobile && activeTab === 'canvas') {
                setActiveTab('games');
            }
        },
        onSwipedRight: () => {
            if (isMobile && activeTab === 'games') {
                setActiveTab('canvas');
            } else if (isMobile && activeTab === 'canvas') {
                setActiveTab('chat');
            }
        },
    });

    const roomDocRef = useMemo(() => {
        if (!firebaseContext?.db) return null;
        return doc(firebaseContext.db, 'rooms', roomId);
    }, [firebaseContext, roomId]);

    const { data: room, loading: roomLoading } = useDoc<Room>(roomDocRef);

    useEffect(() => {
        if (user && !roomLoading) {
            validate();
        }
    }, [user, roomLoading, validate]);

    useEffect(() => {
        if (!user) return;

        if (isDemoMode()) {
            if (!firebaseContext?.db || !firebaseContext?.auth || !firebaseContext?.storage) return;
            try {
                const chatService = getChatService(roomId, firebaseContext.db, firebaseContext.auth, firebaseContext.storage);
                chatService.joinRoom(user, false).catch(err => {
                    logger.error("Error joining room in demo mode", err as Error, { roomId, userId: user.id });
                });
            } catch (err) {
                logger.error("Failed to get ChatService in demo mode", err as Error, { roomId, userId: user.id });
            }
            return;
        }

        if (!firebaseContext?.db || !firebaseContext?.auth || !firebaseContext?.storage) return;

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
        });

        return () => {
            if (isDemoMode()) {
                if (firebaseContext?.db && firebaseContext?.auth && firebaseContext?.storage) {
                    const chatService = getChatService(roomId, firebaseContext.db, firebaseContext.auth, firebaseContext.storage);
                    chatService.leaveRoom().catch(() => { });
                }
                return;
            }
            leaveRoom().catch(() => { });
            import('@/services/RoomManager').then(({ disconnectRoomManager }) => {
                disconnectRoomManager(roomId).catch(() => { });
            });
        };
    }, [user, roomId, joinRoom, leaveRoom, firebaseContext]);

    const handleProfileCreate = async (username: string, avatar: string) => {
        try {
            setIsCreating(true);
            await createProfile(username, avatar);
        } catch (err) {
            logger.error('Could not create profile', err as Error, { username, roomId });
            toast({ title: 'Ошибка', description: 'Не удалось создать профиль', variant: 'destructive' });
            setIsCreating(false);
            throw err;
        }
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('chatUsername');
        router.push('/');
    }, [router]);

    const handleSettings = useCallback(() => {
        setShowSettings(true);
    }, []);

    // Loading states - використовуємо skeleton для кращого UX
    if (!firebaseContext) return <LoadingScreen text="Инициализация..." showSkeleton />;
    if (isLoading) return <LoadingScreen text="Загрузка..." showSkeleton />;
    if (userError) return <ErrorScreen onRetry={() => window.location.reload()} />;

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

    if (roomLoading && !room) return <LoadingScreen text="Подключение..." showSkeleton />;

    const otherUser = room?.participantProfiles?.find(p => p.id !== user?.id);

    return (
        <div className="flex h-screen-safe w-full overflow-hidden bg-[var(--bg-primary)]">
            {/* Connection Status Banner */}
            <ConnectionStatus />

            {/* Settings Panel */}
            <SettingsPanel
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />

            {/* Onboarding Tour */}
            {showOnboarding && user && (
                <OnboardingTour onComplete={completeOnboarding} />
            )}

            {/* Desktop Sidebar */}
            {!isMobile && (
                <ChatSidebar
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    onLogout={handleLogout}
                    onSettings={handleSettings}
                />
            )}

            {/* Main Content with swipe support and animations */}
            <main
                className={cn(
                    "flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden",
                    isMobile && "pb-[var(--nav-height-mobile)]"
                )}
                {...(isMobile ? swipeHandlers : {})}
            >
                <AnimatedTabTransition activeTab={activeTab} className="flex-1 flex flex-col min-h-0">
                    {activeTab === 'chat' && (
                        <ChatArea
                            user={user}
                            roomId={roomId}
                            onMobileBack={handleMobileBack}
                        />
                    )}

                    {(activeTab === 'canvas' || activeTab === 'games') && (
                        <Suspense fallback={<LoadingScreen text="Загрузка..." showSkeleton />}>
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
                        <div className="flex-1 p-4 overflow-y-auto">
                            <UserList users={room?.participantProfiles || []} currentUserId={user.id} />
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <ChatStats
                            messageCount={0}
                            userCount={room?.participantProfiles?.length || 0}
                            timeInChat="0м"
                        />
                    )}
                </AnimatedTabTransition>
            </main>

            {/* Mobile Navigation - упрощенная */}
            {isMobile && (
                <MobileNavigation
                    activeTab={activeTab}
                    onTabChange={(tab) => handleTabChange(tab)}
                />
            )}
        </div>
    );
}
