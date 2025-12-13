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
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {otherUser && (
          <div className={`w-2 h-2 rounded-full ${
            isOnline !== false ? 'bg-green-400 animate-pulse' : 'bg-neutral-500'
          }`} />
        )}
        <span className="text-sm font-medium tracking-widest uppercase text-white/80">
          {otherUser ? otherUser.name : `Комната ${roomId.toUpperCase()}`}
        </span>
        {!networkStatus && (
          <div className="flex items-center gap-1 text-xs text-yellow-400">
            <WifiOff className="w-3 h-3" />
            <span>Офлайн</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 text-neutral-400">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollaborationSpace}
          className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10"
        >
          {isCollaborationSpaceVisible ? <PanelRightClose className="w-5 h-5"/> : <PanelRightOpen className="w-5 h-5" />}
        </Button>
        <MoreVertical className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
      </div>
    </header>
  );
}
