"use client";

import { useEffect, useState, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getConnectionManager, ConnectionState } from '@/lib/connection-manager';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'online',
    isOnline: true,
    isSlow: false,
    lastOnlineAt: null,
    reconnectAttempts: 0,
    effectiveType: null,
    downlink: null,
    rtt: null,
  });
  const [showBanner, setShowBanner] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const previousStatusRef = useRef<string>('online');

  useEffect(() => {
    const manager = getConnectionManager();
    if (!manager) return;

    const unsubscribe = manager.subscribe((state) => {
      const wasOffline = previousStatusRef.current !== 'online';
      previousStatusRef.current = state.status;

      setConnectionState(state);

      // Show banner for non-online states
      if (state.status !== 'online') {
        setShowBanner(true);
        setShowSuccessBanner(false);
      } else if (isInitialized && wasOffline) {
        // Show success banner when reconnected
        setShowSuccessBanner(true);
        setShowBanner(true);
        // Hide banner after showing success message
        setTimeout(() => {
          setShowBanner(false);
          setShowSuccessBanner(false);
        }, 3000);
      }
    });

    // Small delay before marking as initialized to avoid false "reconnected" on mount
    const initTimer = setTimeout(() => {
      setIsInitialized(true);
    }, 1000);

    return () => {
      unsubscribe();
      clearTimeout(initTimer);
    };
  }, [isInitialized]);

  // Don't show anything if online and banner is hidden
  if (!showBanner && connectionState.status === 'online') {
    return null;
  }

  const handleRetry = () => {
    const manager = getConnectionManager();
    manager?.forceReconnect();
  };

  const getStatusConfig = () => {
    if (showSuccessBanner) {
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        text: 'Соединение восстановлено',
        bgColor: 'bg-green-500',
        textColor: 'text-white',
        showRetry: false,
      };
    }

    switch (connectionState.status) {
      case 'offline':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Нет соединения. Сообщения будут отправлены при восстановлении.',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          showRetry: true,
        };
      case 'slow':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Медленное соединение. Загрузка может занять больше времени.',
          bgColor: 'bg-yellow-500',
          textColor: 'text-yellow-950',
          showRetry: false,
        };
      case 'reconnecting':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: `Восстановление соединения${connectionState.reconnectAttempts > 1 ? ` (попытка ${connectionState.reconnectAttempts})` : ''}...`,
          bgColor: 'bg-yellow-500',
          textColor: 'text-yellow-950',
          showRetry: false,
        };
      case 'online':
      default:
        return {
          icon: <Wifi className="w-4 h-4" />,
          text: 'Соединение восстановлено',
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          showRetry: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "flex items-center justify-center gap-2 py-2.5 px-4",
        "text-sm font-medium text-center backdrop-blur-md",
        config.bgColor,
        config.textColor,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {config.icon}
      <span>{config.text}</span>
      {config.showRetry && (
        <button
          onClick={handleRetry}
          className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition-colors"
        >
          Повторить
        </button>
      )}
    </div>
  );
}
