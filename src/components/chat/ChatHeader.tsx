"use client";

import { MoreVertical, PanelRightClose, PanelRightOpen, WifiOff } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

type ChatHeaderProps = {
  roomId: string;
  otherUser?: UserProfile;
  isCollaborationSpaceVisible: boolean;
  onToggleCollaborationSpace: () => void;
  isOnline?: boolean; // User's online status
};

export function ChatHeader({
  roomId,
  otherUser,
  isCollaborationSpaceVisible,
  onToggleCollaborationSpace,
  isOnline = true
}: ChatHeaderProps) {
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b border-white/10 bg-gradient-to-r from-black/60 to-neutral-900/60 backdrop-blur-md sticky top-0 z-20 shadow-lg">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {otherUser && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/20 bg-center bg-cover bg-neutral-800 flex-shrink-0"
              style={{ backgroundImage: `url(${otherUser.avatar})` }}
            />
            <div className={`w-2 h-2 rounded-full ${isOnline !== false ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' : 'bg-neutral-500'
              }`} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-semibold text-white truncate">
            {otherUser ? otherUser.name : `Комната ${roomId.toUpperCase()}`}
          </h1>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            {otherUser && (
              <span>{isOnline !== false ? 'В сети' : 'Не в сети'}</span>
            )}
            {!networkStatus && (
              <div className="flex items-center gap-1 text-yellow-400">
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">Офлайн</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollaborationSpace}
          className="h-8 w-8 sm:h-9 sm:w-9 text-neutral-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-105"
          title={isCollaborationSpaceVisible ? 'Скрыть панель' : 'Показать панель'}
        >
          {isCollaborationSpaceVisible ?
            <PanelRightClose className="w-4 h-4 sm:w-5 sm:h-5" /> :
            <PanelRightOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          }
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 text-neutral-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-105"
          title="Меню"
        >
          <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </header>
  );
}
