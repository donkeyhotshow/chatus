"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, WifiOff, RefreshCw, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileErrorHandlerProps {
    isOnline?: boolean;
    isConnected?: boolean;
    isReconnecting?: boolean;
    lastError?: string | null;
    onRetry?: () => void;
}

export function MobileErrorHandler({
    isOnline = true,
    isConnected = true,
    isReconnecting = false,
    lastError,
    onRetry
}: MobileErrorHandlerProps) {
    const isMobile = useIsMobile();
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (!isOnline) {
            setErrorMessage('Нет подключения к интернету');
            setShowError(true);
        } else if (!isConnected && !isReconnecting) {
            setErrorMessage('Потеряно соединение с сервером');
            setShowError(true);
        } else if (isReconnecting) {
            setErrorMessage('Переподключение...');
            setShowError(true);
        } else if (lastError) {
            setErrorMessage(lastError);
            setShowError(true);
            // Haptic feedback for errors
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
            // Auto-hide error after 4 seconds
            const timer = setTimeout(() => {
                setShowError(false);
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            setShowError(false);
        }
    }, [isOnline, isConnected, isReconnecting, lastError]);

    // Don't show on desktop - use regular toast system
    if (!isMobile || !showError) {
        return null;
    }

    const getIcon = () => {
        if (!isOnline) return <WifiOff className="w-4 h-4" />;
        if (isReconnecting) return <RefreshCw className="w-4 h-4 animate-spin" />;
        return <AlertTriangle className="w-4 h-4" />;
    };

    const getStatusColor = () => {
        if (!isOnline) return 'border-red-500/50 bg-red-900/90 text-red-100';
        if (isReconnecting) return 'border-yellow-500/50 bg-yellow-900/90 text-yellow-100';
        return 'border-orange-500/50 bg-orange-900/90 text-orange-100';
    };

    return (
        <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transform transition-all duration-300",
                getStatusColor()
            )}>
                {getIcon()}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{errorMessage}</p>
                </div>
                <div className="flex items-center gap-2">
                    {onRetry && !isReconnecting && (
                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) {
                                    navigator.vibrate(10);
                                }
                                onRetry();
                            }}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 active:scale-95"
                        >
                            Повторить
                        </button>
                    )}
                    <button
                        onClick={() => setShowError(false)}
                        className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-all duration-200 active:scale-95"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
