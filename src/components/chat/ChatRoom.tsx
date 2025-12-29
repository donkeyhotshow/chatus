"use client";

import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@/lib/types';
import { MessageCircle, PenTool, Gamepad2 } from 'lucide-react';
import { OptimizedAvatar } from '../ui/OptimizedImage';
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
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useNavigationState } from '@/hooks/useNavigationState';
import { NavigationState } from '@/lib/navigation-state';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRecentRooms } from '@/hooks/useRecentRooms';
import { useTabScrollMemory } from '@/hooks/useScrollMemory';
import { logger } from '@/lib/logger';
import { isDemoMode } from '@/lib/demo-mode';
import { getChatService } from '@/services/ChatService';
import { cn } from '@/lib/utils';
import { useSwipe } from '@/hooks/use-swipe';
import { OnboardingTour, useOnboarding } from './OnboardingTour';
import { ChatSkeleton } from './ChatSkeleton';
import { SearchDialog } from './SearchDialog';
import { AnimatedTabTransition } from '../layout/AnimatedTabTransition';
import { DesktopRightPanel } from '../layout/DesktopRightPanel';
import { safariSafeClick } from '@/lib/safari-workarounds';
import { RoomState } from '@/lib/session-manager';

// Lazy load heavy components
const CollaborationSpace = lazy(() => import('./CollaborationSpace').then(m => ({ default: m.CollaborationSpace })));

// Skeleton-based loading з fallback - Dark Minimalism Theme
function LoadingScreen({ text, showSkeleton = false, isSlow = false }: { text: string; showSkeleton?: boolean; isSlow?: boolean }) {
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        // Show fallback sooner if connection is slow
        const timeout = isSlow ? 10000 : 15000;
        const timer = setTimeout(() => setShowFallback(true), timeout);
        return () => clearTimeout(timer);
    }, [isSlow]);

    // Safari-safe reload handler
    const handleReload = safariSafeClick(() => {
        window.location.reload();
    }, 10);

    if (showFallback) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[var(--bg-primary)] p-6">
                <div className="max-w-sm text-center space-y-4 p-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-xl">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
                        <span className="text-2xl">⏳</span>
                    </div>
                    <p className="text-[var(--text-secondary)]">
                        {isSlow
                            ? 'Медленное соединение. Загрузка занимает больше времени...'
                            : 'Загрузка занимает больше времени, чем обычно'
                        }
                    </p>
                    <button
                        onClick={handleReload}
                        className="w-full min-h-[48px] py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-[var(--accent-contrast)] font-semibold rounded-xl hover:shadow-[var(--shadow-glow)] transition-all hover:-translate-y-0.5 touch-manipulation"
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
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-xl animate-fade-in">
                <div className="w-10 h-10 border-2 border-[var(--glass-border)] border-t-[var(--primary)] rounded-full animate-spin" />
                <span className="text-sm text-[var(--text-secondary)] font-medium">{text}</span>
                {isSlow && (
                    <span className="text-xs text-[var(--warning)] animate-pulse">Медленное соединение...</span>
                )}
            </div>
        </div>
    );
}

// Экран ошибки - Dark Minimalism Theme
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
    // Safari-safe retry handler
    const handleRetry = safariSafeClick(onRetry, 10);

    return (
        <div className="flex h-full w-full items-center justify-center bg-[var(--bg-primary)] p-6">
            <div className="max-w-sm text-center space-y-4 p-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-xl animate-fade-in">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[var(--error)]/15 flex items-center justify-center shadow-[var(--shadow-glow-error)]">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Ошибка подключения
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                    Не удалось подключиться к серверу
                </p>
                <button
                    onClick={handleRetry}
                    className="w-full min-h-[48px] py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-[var(--accent-contrast)] font-semibold rounded-xl hover:shadow-[var(--shadow-glow)] transition-all hover:-translate-y-0.5 touch-manipulation"
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
    const [showSearch, setShowSearch] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const firebaseContext = useFirebase();
    const isMobile = useIsMobile();
    const connectionState = useConnectionStatus();
    const { currentState, goBack, updateState } = useNavigationState({
      roomId,
      onNavigate: useCallback((state: NavigationState) => {
        // Sync activeTab with navigation state
        if (state.currentView === 'game') {
          setActiveTab('games');
        } else if (state.currentView === 'canvas') {
          setActiveTab('canvas');
        } else if (state.currentView === 'chat') {
          setActiveTab('chat');
        }
      }, []),
    });

    const { user, isLoading, createProfile, error: userError } = useCurrentUser(roomId);
    const [isCreating, setIsCreating] = useState(false);

    // Onboarding
    const { showOnboarding, completeOnboarding } = useOnboarding();

    // Recent rooms for Ctrl+1-9 navigation - Этап 4
    const { addRoom, navigateToRoom } = useRecentRooms();

    // Scroll memory for tabs - Этап 6
    const { saveTabPosition, getTabPosition } = useTabScrollMemory(roomId);

    // Session persistence - P0 fix for refresh/back navigation
    const handleSessionRestore = useCallback((state: RoomState) => {
        if (state.activeTab) {
            setActiveTab(state.activeTab as ChatTab);
        }
        logger.info('[ChatRoom] Session restored', { activeTab: state.activeTab });
    }, []);

    const handleVisibilityChange = useCallback((isVisible: boolean) => {
        if (isVisible && connectionState.status === 'offline') {
            // Tab became visible while offline - show reconnection UI
            logger.debug('[ChatRoom] Tab visible while offline');
        }
    }, [connectionState.status]);

    const { saveCurrentState } = useSessionPersistence({
        roomId,
        user,
        activeTab,
        onRestore: handleSessionRestore,
        onVisibilityChange: handleVisibilityChange,
    });

    usePresence(roomId, user?.id || null);
    const { validate } = useRoom(roomId);
    const { joinRoom, leaveRoom } = useRoomManager(roomId);

    const handleTabChange = useCallback((tab: ChatTab | string) => {
        // Save current tab scroll position before switching
        const scrollContainer = document.querySelector('[data-scroll-container]');
        if (scrollContainer) {
            saveTabPosition(activeTab, scrollContainer.scrollTop);
        }

        setActiveTab(tab as ChatTab);
        // Update navigation state
        const view = tab === 'chat' ? 'chat' : (tab === 'canvas' ? 'canvas' : (tab === 'games' ? 'game' : 'chat'));
        updateState(view as any);
        // Save state on tab change
        setTimeout(saveCurrentState, 100);

        // Restore scroll position for new tab
        setTimeout(() => {
            const savedPosition = getTabPosition(tab);
            const newScrollContainer = document.querySelector('[data-scroll-container]');
            if (savedPosition && newScrollContainer) {
                newScrollContainer.scrollTop = savedPosition.scrollTop;
            }
        }, 150);
    }, [activeTab, saveCurrentState, updateState, saveTabPosition, getTabPosition]);

    const handleMobileBack = useCallback(() => {
        if (isMobile && activeTab !== 'chat') {
            // If on mobile and not on chat tab, go back to chat tab first
            setActiveTab('chat');
            updateState('chat');
        } else {
            // Try app-level back navigation first
            const handled = goBack();
            if (!handled) {
                // Fallback to home page
                router.push('/');
            }
        }
    }, [isMobile, activeTab, goBack, router, updateState]);

    // Swipe gestures for mobile navigation with haptic feedback
    const swipeHandlers = useSwipe({
        onSwipedLeft: () => {
            if (isMobile && activeTab === 'chat') {
                if ('vibrate' in navigator) navigator.vibrate(10);
                setActiveTab('canvas');
                updateState('canvas');
            } else if (isMobile && activeTab === 'canvas') {
                if ('vibrate' in navigator) navigator.vibrate(10);
                setActiveTab('games');
                updateState('game');
            }
        },
        onSwipedRight: () => {
            if (isMobile && activeTab === 'games') {
                if ('vibrate' in navigator) navigator.vibrate(10);
                setActiveTab('canvas');
                updateState('canvas');
            } else if (isMobile && activeTab === 'canvas') {
                if ('vibrate' in navigator) navigator.vibrate(10);
                setActiveTab('chat');
                updateState('chat');
            }
        },
        preventOnInteractive: true, // Don't trigger swipes on buttons, inputs, etc.
    });

    const roomDocRef = useMemo(() => {
        if (!firebaseContext?.db) return null;
        return doc(firebaseContext.db, 'rooms', roomId);
    }, [firebaseContext, roomId]);

    const { data: room, loading: roomLoading } = useDoc<Room>(roomDocRef);

    useEffect(() => {
        if (user && !roomLoading) {
            validate();
            // Регистрируем комнату в recent rooms для Ctrl+1-9
            addRoom(roomId, room?.participantProfiles?.find(p => p.id !== user.id)?.name);
        }
    }, [user, roomLoading, validate, addRoom, roomId, room?.participantProfiles]);

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
            console.error('Profile creation failed:', err);
            logger.error('Could not create profile', err as Error, { username, roomId });
            toast({ title: 'Ошибка', description: 'Не удалось создать профиль', variant: 'destructive' });
            setIsCreating(false);
            throw err;
        }
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('chatUsername');
        // Use setTimeout to ensure navigation happens after React event handling
        setTimeout(() => {
            router.push('/');
        }, 0);
    }, [router]);

    const handleSettings = useCallback(() => {
        setShowSettings(true);
    }, []);

    // Keyboard shortcuts (Этап 4: Desktop navigation)
    const handleSearchOpen = useCallback(() => {
        setShowSearch(true);
    }, []);

    const handleSearchClose = useCallback(() => {
        setShowSearch(false);
    }, []);

    const handleNewChat = useCallback(() => {
        router.push('/');
    }, [router]);

    const handleEscape = useCallback(() => {
        if (showSearch) {
            setShowSearch(false);
        } else if (showSettings) {
            setShowSettings(false);
        }
    }, [showSearch, showSettings]);

    // Toggle right panel handler - moved before conditional returns
    const handleToggleRightPanel = useCallback(() => {
        setShowRightPanel(prev => !prev);
    }, []);

    // Integrate keyboard shortcuts
    useKeyboardShortcuts({
        onSearch: handleSearchOpen,
        onNewChat: handleNewChat,
        onEscape: handleEscape,
        onNavigateChat: navigateToRoom,
    });

    // Loading states - використовуємо skeleton для кращого UX
    const isSlow = connectionState.isSlow;

    if (!firebaseContext) return <LoadingScreen text="Инициализация..." showSkeleton isSlow={isSlow} />;

    // P0 FIX: Optimistic UI - show chat if we have user data, even if still verifying
    if (isLoading && !user) return <LoadingScreen text="Загрузка..." showSkeleton isSlow={isSlow} />;

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

    // Show loading only if we don't have room data yet
    if (roomLoading && !room) return <LoadingScreen text="Подключение..." showSkeleton isSlow={isSlow} />;

    const otherUser = room?.participantProfiles?.find(p => p.id !== user?.id);

    return (
        <div className={cn(
            "h-screen-safe w-full overflow-hidden bg-[var(--bg-primary)]",
            isMobile ? "flex flex-col" : "flex flex-row"
        )}>
            {/* Connection Status Banner */}
            <ConnectionStatus />

            {/* Search Dialog (Ctrl+K) */}
            <SearchDialog
                isOpen={showSearch}
                onClose={handleSearchClose}
                onNewChat={handleNewChat}
            />

            {/* Settings Panel */}
            <SettingsPanel
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />

            {/* Onboarding Tour */}
            {showOnboarding && user && (
                <OnboardingTour onComplete={completeOnboarding} />
            )}

            {/* Desktop Sidebar - Global only */}
            {!isMobile && (
                <ChatSidebar
                    onLogout={handleLogout}
                    onSettings={handleSettings}
                />
            )}

            {/* Main Content with swipe support and animations */}
            <main
                className={cn(
                    "flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden",
                    isMobile && "pb-[calc(60px+env(safe-area-inset-bottom,0px))]"
                )}
                {...(isMobile ? swipeHandlers : {})}
            >
                {/* Desktop Room Topbar - Stage 1.1 */}
                {!isMobile && (
                    <div className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center px-6 gap-8 shrink-0">
                        <div className="flex items-center gap-2 mr-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-white tracking-tight">Комната</span>
                        </div>

                        <div className="flex h-full items-center gap-6">
                            {[
                                { id: 'chat', label: 'Чат', icon: MessageCircle },
                                { id: 'canvas', label: 'Холст', icon: PenTool },
                                { id: 'games', label: 'Игры', icon: Gamepad2 }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id as ChatTab)}
                                    className={cn(
                                        "h-full px-1 relative flex items-center gap-2 text-sm font-medium transition-all group",
                                        activeTab === tab.id 
                                            ? "text-white" 
                                            : "text-white/40 hover:text-white/70"
                                    )}
                                >
                                    <tab.icon className={cn(
                                        "w-4 h-4 transition-transform group-hover:scale-110",
                                        activeTab === tab.id ? "text-violet-400" : ""
                                    )} />
                                    <span>{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="ml-auto flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {room?.participantProfiles?.slice(0, 3).map((p) => (
                                    <OptimizedAvatar 
                                        key={p.id} 
                                        src={p.avatar} 
                                        alt={p.name} 
                                        size={28} 
                                        className="border-2 border-black"
                                    />
                                ))}
                                {(room?.participantProfiles?.length || 0) > 3 && (
                                    <div className="w-7 h-7 rounded-full border-2 border-black bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] text-white/40">
                                        +{(room?.participantProfiles?.length || 0) - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <AnimatedTabTransition activeTab={activeTab} className="flex-1 flex flex-col min-h-0">
                    {activeTab === 'chat' && (
                        <ChatArea
                            user={user}
                            roomId={roomId}
                            onMobileBack={handleMobileBack}
                            hideSearch={isMobile}
                            navigationState={currentState}
                            onSettings={handleSettings}
                            onLogout={handleLogout}
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

            {/* Mobile Navigation - Moved to bottom */}
            {isMobile && (
                <MobileNavigation
                    activeTab={activeTab}
                    onTabChange={(tab) => handleTabChange(tab)}
                />
            )}

            {/* Desktop Right Panel - Этап 6 */}
            {!isMobile && activeTab === 'chat' && (
                <DesktopRightPanel
                    isOpen={showRightPanel}
                    onToggle={handleToggleRightPanel}
                    users={room?.participantProfiles || []}
                    currentUserId={user.id}
                    roomName={room?.name}
                />
            )}
        </div>
    );
}
