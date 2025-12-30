
"use client";

import { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react';
import type { GameState, UserProfile } from '@/lib/types';
import { PenTool, Gamepad2, Users, ChevronLeft, ChevronRight, Maximize2, Minimize2, Plus, List } from 'lucide-react';
import { UserList } from './UserList';
import { useChatService } from '@/hooks/useChatService';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDoc } from '@/hooks/useDoc';
import { useCollection } from '@/hooks/useCollection';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import { VerticalResizer } from '../ui/VerticalResizer';
import { useSwipe } from '@/hooks/use-swipe';

// Lazy load heavy components
const SharedCanvas = lazy(() => import('../canvas/SharedCanvas').then(m => ({ default: m.SharedCanvas })));
const GameLobby = lazy(() => import('../games/GameLobby').then(m => ({ default: m.GameLobby })));

// P2 UX-5: Import CanvasSkeleton for loading state
import { CanvasSkeleton } from '../ui/skeletons/CanvasSkeleton';

type CanvasSheet = {
  id: string;
  name: string;
  createdAt: Timestamp;
};

import { ChatPeek } from './ChatPeek';

type CollaborationSpaceProps = {
  isVisible: boolean;
  roomId: string;
  user: UserProfile | null;
  otherUser?: UserProfile;
  allUsers: UserProfile[];
  mobileActiveTab?: 'chat' | 'games' | 'canvas' | 'users' | 'stats';
};

export function CollaborationSpace({
  isVisible,
  roomId,
  user,
  otherUser,
  allUsers,
  mobileActiveTab,
}: CollaborationSpaceProps) {
  const { service, messages } = useChatService(roomId, user || undefined);
  // BUG #15 FIX + P0-1 FIX: Initialize activeTab based on mobileActiveTab prop
  // P0-1: Ensure canvas view renders correctly when navigating via URL or tab
  const [activeTab, setActiveTab] = useState<'games' | 'canvas' | 'users' | 'stats'>(() => {
    // Priority: mobileActiveTab prop > default to canvas for better UX
    if (mobileActiveTab === 'canvas') return 'canvas';
    if (mobileActiveTab === 'games') return 'games';
    if (mobileActiveTab === 'users') return 'users';
    if (mobileActiveTab === 'stats') return 'stats';
    return 'canvas'; // P0-1 FIX: Default to canvas instead of games
  });
  const [canvasHeight, setCanvasHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('collabspace-canvas-height');
      return saved ? parseInt(saved, 10) : 400;
    }
    return 400;
  });

  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const collabSpaceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { db } = useFirebase()!;
  const isMobile = useIsMobile();

  // P0-1 FIX: Sync with mobile active tab - always sync, not just on mobile
  useEffect(() => {
    if (mobileActiveTab && mobileActiveTab !== 'chat') {
      const newTab = mobileActiveTab === 'stats' ? 'users' : mobileActiveTab as 'games' | 'canvas' | 'users';
      if (newTab !== activeTab) {
        setActiveTab(newTab);
      }
    }
  }, [mobileActiveTab, activeTab]);


  // Subscribe to game state for maze
  const gameDocRef = useMemo(() => db ? doc(db, 'rooms', roomId, 'games', 'maze') : null, [db, roomId]);
  const { data: activeGame } = useDoc<GameState>(gameDocRef);

  // Subscribe to sheets
  const sheetsQuery = useMemo(() => db ? query(collection(db, 'rooms', roomId, 'canvasSheets'), orderBy('createdAt', 'asc')) : null, [db, roomId]);
  const { data: sheets, loading: sheetsLoading } = useCollection<CanvasSheet>(sheetsQuery);

  useEffect(() => {
    if (activeGame?.type === 'maze') {
      setActiveTab('canvas');
    }
  }, [activeGame]);

  const handleCreateNewSheet = useCallback(async () => {
    if (!user || !service) return;
    const newSheetName = `Sheet ${(sheets?.length || 0) + 1}`;
    try {
      const docRef = await service.createCanvasSheet(newSheetName);
      setActiveSheetId(docRef.id);
      toast({ title: `Created ${newSheetName}` });
    } catch (error) {
      logger.error('Error creating new sheet', error as Error, { roomId, user: user?.id });
      toast({ title: 'Could not create new sheet', variant: 'destructive' });
    }
  }, [user, service, sheets, setActiveSheetId, toast, roomId]);

  useEffect(() => {
    if (!sheetsLoading && sheets?.length === 0) {
      handleCreateNewSheet();
    } else if (!sheetsLoading && sheets && sheets.length > 0 && !activeSheetId) {
      setActiveSheetId(sheets[0].id);
    }
  }, [sheets, sheetsLoading, activeSheetId, handleCreateNewSheet]);

  // Save canvas height to localStorage
  const handleCanvasResize = (height: number) => {
    setCanvasHeight(height);
    localStorage.setItem('collabspace-canvas-height', height.toString());
  };

  const navigateSheet = (direction: 'next' | 'prev') => {
    if (!activeSheetId || !sheets || sheets.length < 2) return;
    const currentIndex = sheets.findIndex(s => s.id === activeSheetId);
    if (currentIndex === -1) return;

    let newIndex = -1;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % sheets.length;
    } else { // prev
      newIndex = (currentIndex - 1 + sheets.length) % sheets.length;
    }

    if (newIndex !== -1) {
      setActiveSheetId(sheets[newIndex].id);
    }
  };

  const handleFullscreenToggle = () => {
    const elem = collabSpaceRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        logger.error('Error attempting to enable full-screen mode', err as Error, {
          message: err.message,
          name: err.name
        });
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        handleFullscreenToggle();
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeyDown);
    }
  }, [isFullscreen]);

  const activeSheet = sheets?.find(s => s.id === activeSheetId);

  // Memoize tabs to prevent useCallback recreation on every render
  const tabs = useMemo(() => [
    { id: 'canvas' as const, label: 'Холст', icon: PenTool },
    { id: 'games' as const, label: 'Игры', icon: Gamepad2 },
    { id: 'users' as const, label: 'Люди', icon: Users },
  ], []);

  // Swipe handling for mobile tab switching - must be before conditional return
  const handleSwipeLeft = useCallback(() => {
    if (!isMobile) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  }, [isMobile, activeTab, tabs]);

  const handleSwipeRight = useCallback(() => {
    if (!isMobile) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  }, [isMobile, activeTab, tabs]);

  const swipeHandlers = useSwipe({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      ref={collabSpaceRef}
      {...swipeHandlers}
      className={cn(
        "flex flex-col bg-[var(--bg-primary)] transition-all duration-300 touch-pan-y",
        isFullscreen
          ? 'fixed inset-0 w-screen h-screen z-50'
          : isMobile
            ? "flex-1 h-full"
            : 'relative h-full w-full border-l border-[var(--border-primary)] z-40'
      )}
    >
      {/* Desktop tabs removed - moved to Room Topbar in ChatRoom.tsx */}

      <div className="flex-1 flex flex-col overflow-y-auto mobile-scroll-y">

        {/* CANVAS TAB */}
        <div 
          className={`flex-1 flex flex-col h-full ${activeTab === 'canvas' ? 'flex' : 'hidden'}`}
          role="tabpanel"
          id="tabpanel-canvas"
          aria-labelledby="tab-canvas"
        >
          <div className={`p-[var(--space-2)] sm:p-[var(--space-4)] border-b border-[var(--border-subtle)] shrink-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur-xl flex justify-between items-center ${isMobile ? 'gap-[var(--space-2)]' : ''}`}>
            <div className="flex items-center gap-[var(--space-2)] bg-[var(--bg-tertiary)] rounded-xl p-1 border border-[var(--border-subtle)]">
              <button onClick={() => navigateSheet('prev')} disabled={!sheets || sheets.length <= 1 || activeGame?.type === 'maze'} className="p-2 hover:text-[var(--text-primary)] text-[var(--text-muted)] disabled:opacity-30 touch-target rounded-lg hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[var(--font-caption)] font-mono font-bold w-12 sm:w-16 text-center text-[var(--text-primary)] truncate">
                {activeGame?.type === 'maze' ? 'MAZE' : (activeSheet?.name || '...')}
              </span>
              <button onClick={() => navigateSheet('next')} disabled={!sheets || sheets.length <= 1 || activeGame?.type === 'maze'} className="p-2 hover:text-[var(--text-primary)] text-[var(--text-muted)] disabled:opacity-30 touch-target rounded-lg hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1"></div>
              <button 
                onClick={handleCreateNewSheet} 
                disabled={activeGame?.type === 'maze'} 
                className="p-2 hover:text-[var(--success)] text-[var(--text-muted)] disabled:opacity-30 touch-target rounded-lg hover:bg-[var(--success)]/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" 
                title="Создать новый лист"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                className="p-2 hover:text-[var(--accent-chat)] text-[var(--text-muted)] touch-target rounded-lg hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" 
                title="Переключить лист"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {!isMobile && (
              <button
                onClick={handleFullscreenToggle}
                className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center border border-white/[0.06]"
                title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            )}
          </div>

          {/* Canvas area with resizable height on desktop */}
          <div
            className={`bg-black relative overflow-hidden ${!isFullscreen && !isMobile ? 'm-4 rounded-2xl border border-white/[0.06]' : isMobile ? 'm-2 rounded-xl border border-white/[0.06]' : ''}`}
            style={{
              height: isMobile || isFullscreen ? 'auto' : `${canvasHeight}px`,
              minHeight: isMobile || isFullscreen ? 'auto' : '200px',
              flex: isMobile || isFullscreen ? '1' : 'none'
            }}
          >
            {activeSheetId && user && (
              <Suspense fallback={<CanvasSkeleton />}>
                <SharedCanvas
                  key={activeSheetId}
                  roomId={roomId}
                  sheetId={activeSheetId}
                  user={user}
                  isMazeActive={activeGame?.type === 'maze'}
                />
              </Suspense>
            )}
            {activeGame?.type !== 'maze' && (
              <div className="absolute top-4 right-4 text-[10px] text-white/20 font-mono pointer-events-none select-none">
                SHEET: {(sheets?.findIndex(s => s.id === activeSheetId) ?? -1) + 1}
              </div>
            )}
          </div>

          {/* Vertical resizer for canvas (desktop only) */}
          {!isMobile && !isFullscreen && (
            <VerticalResizer
              onResize={handleCanvasResize}
              minHeight={200}
              maxHeight={800}
              className="mx-4 bg-white/5 hover:bg-violet-400/30"
            />
          )}

          {/* Additional content area below canvas */}
          <div className="flex-1 min-h-0 p-4">
            <div className="text-xs text-white/30 text-center">
              {!isMobile && 'Перетащите границы для изменения размера • '}
              {isMobile ? 'Используйте два пальца для масштабирования холста' : 'Используйте колесо мыши для масштабирования холста'}
            </div>
          </div>
        </div>

        {/* GAMES TAB */}
        <div 
          className={`flex-1 relative bg-black h-full ${activeTab === 'games' ? 'flex flex-col' : 'hidden'}`}
          role="tabpanel"
          id="tabpanel-games"
          aria-labelledby="tab-games"
        >
          {user && (
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" role="status" aria-label="Загрузка игр"></div></div>}>
              <GameLobby roomId={roomId} user={user} otherUser={otherUser} />
            </Suspense>
          )}
        </div>

        {/* USERS TAB */}
        <div 
          className={`flex-1 ${activeTab === 'users' ? 'flex flex-col' : 'hidden'} ${isMobile ? 'pb-4' : ''}`}
          role="tabpanel"
          id="tabpanel-users"
          aria-labelledby="tab-users"
        >
          <UserList users={allUsers} currentUserId={user?.id || ''} />
        </div>
      </div>

      {/* Mobile Chat Peek */}
      {isMobile && !isFullscreen && (
        <ChatPeek 
          messages={messages} 
          user={user} 
          onSend={(text) => service?.sendMessage({ text, user: user!, senderId: user!.id, reactions: [] })} 
        />
      )}
    </aside>
  );
}
