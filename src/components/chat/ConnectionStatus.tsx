"use client";

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(true);
      // Show reconnecting state briefly
      setTimeout(() => {
        setIsReconnecting(false);
        // Hide banner after successful reconnection
        setTimeout(() => setShowBanner(false), 2000);
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show banner if initially offline
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline && !isReconnecting) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "flex items-center justify-center gap-2 py-2 px-4",
        "text-sm font-medium text-center",
        isReconnecting
          ? "bg-yellow-500 text-yellow-950"
          : isOnline
          ? "bg-green-500 text-white"
          : "bg-red-500 text-white",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {isReconnecting ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Восстановление соединения...</span>
        </>
      ) : isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Соединение восстановлено</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Нет соединения. Сообщения будут отправлены при восстановлении.</span>
        </>
      )}
    </div>
  );
}
