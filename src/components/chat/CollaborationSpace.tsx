
"use client";

import { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react';
import type { GameState, UserProfile } from '@/lib/types';
import { PenTool, Gamepad2, Users, ChevronLeft, ChevronRight, Maximize2, Minimize2, Plus } from 'lucide-react';
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

type CanvasSheet = {
  id: string;
  name: string;
  createdAt: Timestamp;
};

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
  const { service } = useChatService(roomId, user || undefined);
  const [activeTab, setActiveTab] = useState<'games' | 'canvas' | 'users' | 'stats'>('games');
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

  // Sync with mobile active tab
  useEffect(() => {
    if (isMobile && mobileActiveTab && mobileActiveTab !== 'chat' && mobileActiveTab !== 'stats') {
      setActiveTab(mobileActiveTab as 'games' | 'canvas' | 'users');
    }
  }, [isMobile, mobileActiveTab]);


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
    { id: 'canvas' as const, label: 'Canvas', icon: PenTool },
    { id: 'games' as const, label: 'Games', icon: Gamepad2 },
    { id: 'users' as const, label: 'Users', icon: Users },
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
            ? `fixed inset-0 z-40 ${isVisible ? 'translate-x-0' : 'translate-x-full'}`
            : 'relative h-full w-full border-l border-[var(--border-primary)] z-40'
      )}
    >
      {!isFullscreen && !isMobile && (
        <nav className="flex p-2 gap-1 border-b border-[var(--border-primary)] shrink-0 bg-[var(--bg-secondary)]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const color = tab.id === 'canvas' ? 'var(--draw-primary)' : tab.id === 'games' ? 'var(--game-primary)' : 'var(--accent-primary)';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--bg-tertiary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                )}
                style={isActive ? { color } : undefined}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* CANVAS TAB */}
        <div className={`flex-1 flex flex-col h-full ${activeTab === 'canvas' ? 'flex' : 'hidden'}`}>
          <div className={`p-2 sm:p-4 border-b border-white/5 shrink-0 z-10 bg-neutral-950/90 backdrop-blur-sm flex justify-between items-center ${isMobile ? 'gap-2' : ''}`}>
            <div className="flex items-center gap-1 sm:gap-2 bg-neutral-900 rounded-lg p-1 border border-white/5">
              <button onClick={() => navigateSheet('prev')} disabled={!sheets || sheets.length <= 1 || activeGame?.type === 'maze'} className="p-1 hover:text-white text-neutral-500 disabled:opacity-30 touch-target">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 sm:w-16 text-center text-white truncate">
                {activeGame?.type === 'maze' ? 'MAZE' : (activeSheet?.name || '...')}
              </span>
              <button onClick={() => navigateSheet('next')} disabled={!sheets || sheets.length <= 1 || activeGame?.type === 'maze'} className="p-1 hover:text-white text-neutral-500 disabled:opacity-30 touch-target">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
              <button onClick={handleCreateNewSheet} disabled={activeGame?.type === 'maze'} className="p-1 hover:text-green-400 text-neutral-500 disabled:opacity-30 touch-target" title="New Sheet">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {!isMobile && (
              <button
                onClick={handleFullscreenToggle}
                className="p-2.5 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 transition-colors touch-target"
                title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            )}
          </div>

          {/* Canvas area with resizable height on desktop */}
          <div
            className={`bg-[#0d0d0d] relative overflow-hidden ${!isFullscreen && !isMobile ? 'm-4 rounded-2xl border border-white/10' : isMobile ? 'm-2 rounded-xl border border-white/10' : ''}`}
            style={{
              height: isMobile || isFullscreen ? 'auto' : `${canvasHeight}px`,
              minHeight: isMobile || isFullscreen ? 'auto' : '200px',
              flex: isMobile || isFullscreen ? '1' : 'none'
            }}
          >
            {activeSheetId && user && (
              <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div></div>}>
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
              className="mx-4 bg-white/5 hover:bg-cyan-400/30"
            />
          )}

          {/* Additional content area below canvas */}
          <div className="flex-1 min-h-0 p-4">
            <div className="text-xs text-neutral-500 text-center">
              {!isMobile && 'Перетащите границы для изменения размера • '}
              {isMobile ? 'Используйте два пальца для масштабирования холста' : 'Используйте колесо мыши для масштабирования холста'}
            </div>
          </div>
        </div>

        {/* GAMES TAB */}
        <div className={`flex-1 relative bg-neutral-950 h-full ${activeTab === 'games' ? 'flex flex-col' : 'hidden'}`}>
          {user && (
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div></div>}>
              <GameLobby roomId={roomId} user={user} otherUser={otherUser} />
            </Suspense>
          )}
        </div>

        {/* USERS TAB */}
        <div className={`flex-1 ${activeTab === 'users' ? 'flex flex-col' : 'hidden'} ${isMobile ? 'pb-4' : ''}`}>
          <UserList users={allUsers} currentUserId={user?.id || ''} />
        </div>
      </div>
    </aside>
  );
}
