"use client";

import { useState } from 'react';
import { X, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerState } from '@/lib/games/types/game';
import { GameErrorBoundary } from '@/components/ErrorBoundary';

interface GameContainerProps {
  gameId: string;
  roomId: string;
  iframeSrc: string;
  players: PlayerState[];
  onClose: () => void;
}

export function GameContainer({ gameId, roomId, iframeSrc, players, onClose }: GameContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  return (
    <GameErrorBoundary componentName={`Game: ${gameId}`}>
      <div className={cn(
        "flex flex-col bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-[100] rounded-none" : "relative w-full aspect-video"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">
              {gameId} • {roomId}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Перезагрузить игру"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Закрыть игру"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Iframe */}
        <div className="flex-1 relative bg-[#0a0a0a]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black">
              <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-xs text-violet-500 font-mono animate-pulse">INITIALIZING GAME ENGINE...</p>
            </div>
          )}
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className="w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            allow="autoplay; fullscreen; pointer-lock"
            title={`Game: ${gameId}`}
          />
        </div>

        {/* Players List (Subtle) */}
        <div className="px-4 py-2 bg-neutral-950 border-t border-white/5 flex items-center gap-4 overflow-x-auto scrollbar-hide">
          {players.map(player => (
            <div key={player.id} className="flex items-center gap-2 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-[10px] font-medium text-neutral-400">{player.name}</span>
              <span className="text-[10px] font-bold text-white">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    </GameErrorBoundary>
  );
}
