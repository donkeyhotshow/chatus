"use client";

import { MoreVertical, PanelRightClose, PanelRightOpen, WifiOff, ArrowLeft, Search, Home, LogOut, Settings, Users as UsersIcon, Trash2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';

type ChatHeaderProps = {
  roomId: string;
  otherUser?: UserProfile;
  isCollaborationSpaceVisible: boolean;
  onToggleCollaborationSpace: () => void;
  isOnline?: boolean;
  onBack?: () => void;
  onSearchOpen?: () => void;
};

export function ChatHeader({
  roomId,
  otherUser,
  isCollaborationSpaceVisible,
  onToggleCollaborationSpace,
  isOnline = true,
  onBack,
  onSearchOpen
}: ChatHeaderProps) {
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();

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

  const handleExit = () => {
    if (confirm('Вы уверены, что хотите выйти из комнаты?')) {
      router.push('/');
    }
  };

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="h-9 w-9 text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
            title="На главную"
          >
            <Home className="w-5 h-5" />
          </Button>
        )}

        <div className="flex items-center gap-3 min-w-0">
          {otherUser ? (
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/10 bg-center bg-cover bg-neutral-900"
                style={{ backgroundImage: `url(${otherUser.avatar})` }}
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${isOnline !== false ? 'bg-green-500' : 'bg-neutral-500'
                }`} />
            </div>
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 font-bold text-xs">
              #
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white truncate leading-tight">
              {otherUser ? otherUser.name : `Комната ${roomId.toUpperCase()}`}
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
              {otherUser && (
                <span className={isOnline !== false ? 'text-green-500/80' : ''}>
                  {isOnline !== false ? 'В сети' : 'Офлайн'}
                </span>
              )}
              {!networkStatus && (
                <div className="flex items-center gap-1 text-yellow-500/80">
                  <WifiOff className="w-3 h-3" />
                  <span>Нет сети</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {onSearchOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchOpen}
            className="h-9 w-9 text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Search className="w-4.5 h-4.5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollaborationSpace}
          className="h-9 w-9 text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
        >
          {isCollaborationSpaceVisible ?
            <PanelRightClose className="w-4.5 h-4.5" /> :
            <PanelRightOpen className="w-4.5 h-4.5" />
          }
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
            className="h-9 w-9 text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </Button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900/95 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-2 space-y-1">
                {[
                  { label: 'Настройки комнаты', icon: Settings, onClick: () => alert('В разработке') },
                  { label: 'Участники', icon: UsersIcon, onClick: () => alert('В разработке') },
                  { label: 'Очистить чат', icon: Trash2, onClick: () => confirm('Очистить?') && alert('В разработке'), danger: true },
                  { label: 'Выйти из комнаты', icon: LogOut, onClick: handleExit, danger: true },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setShowMenu(false);
                      item.onClick();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest transition-all rounded-xl ${item.danger
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


