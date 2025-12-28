"use client";

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from './alert';

// ============================================================================
// ConnectionStatus - Управляемый компонент (принимает status prop)
// ============================================================================

interface ConnectionStatusProps {
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    message?: string;
    className?: string;
}

const statusConfig = {
    connecting: {
        icon: Loader2,
        color: 'text-[var(--warning)]',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-[var(--warning)]',
        animate: 'animate-spin'
    },
    connected: {
        icon: CheckCircle2,
        color: 'text-[var(--success)]',
        bgColor: 'bg-green-50',
        borderColor: 'border-[var(--success)]',
        animate: ''
    },
    disconnected: {
        icon: WifiOff,
        color: 'text-[var(--text-muted)]',
        bgColor: 'bg-[var(--bg-tertiary)]',
        borderColor: 'border-[var(--border-primary)]',
        animate: ''
    },
    error: {
        icon: AlertCircle,
        color: 'text-[var(--error)]',
        bgColor: 'bg-red-50',
        borderColor: 'border-[var(--error)]',
        animate: ''
    }
};

export function ConnectionStatus({ status, message, className }: ConnectionStatusProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    const defaultMessages = {
        connecting: 'Подключение...',
        connected: 'Подключено',
        disconnected: 'Отключено',
        error: 'Ошибка подключения'
    };

    return (
        <div className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
            config.bgColor,
            config.borderColor,
            className
        )}>
            <Icon className={cn("w-4 h-4", config.color, config.animate)} />
            <span className={config.color}>
                {message || defaultMessages[status]}
            </span>
        </div>
    );
}

// ============================================================================
// ChatConnectionStatus - для отображения в header чата
// ============================================================================

export function ChatConnectionStatus({
    status,
    roomCode,
    userCount = 1
}: {
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    roomCode?: string;
    userCount?: number;
}) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <ConnectionStatus status={status} />
            {roomCode && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <span>Комната:</span>
                    <code className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)] font-mono">
                        {roomCode}
                    </code>
                </div>
            )}
            {status === 'connected' && (
                <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                    <div className="w-2 h-2 bg-[var(--success)] rounded-full" />
                    <span>{userCount} в сети</span>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// NetworkConnectionStatus - Автономный компонент
// Слушает browser online/offline events и показывает уведомления
// Консолидировано из chat/ConnectionStatus.tsx
// ============================================================================

import { X } from 'lucide-react';

export function NetworkConnectionStatus() {
    const [isConnected, setIsConnected] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsConnected(true);
            setIsDismissed(false);
            setShowAlert(true);
            // Auto-hide after 2 seconds
            setTimeout(() => setShowAlert(false), 2000);
        };

        const handleOffline = () => {
            setIsConnected(false);
            setIsDismissed(false);
            setShowAlert(true);
        };

        // Check initial state
        setIsConnected(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        setShowAlert(false);
    };

    if (isDismissed || (!showAlert && isConnected)) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            <Alert className={`border ${isConnected
                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                : 'border-red-500/50 bg-red-500/10 text-red-400'
                } backdrop-blur-sm animate-in slide-in-from-top-2`}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <Wifi className="w-4 h-4" />
                        ) : (
                            <WifiOff className="w-4 h-4" />
                        )}
                        <AlertDescription className="font-medium">
                            {isConnected
                                ? 'Подключение восстановлено'
                                : 'Нет подключения к интернету. Сообщения не будут отправлены.'
                            }
                        </AlertDescription>
                    </div>
                    {/* Dismiss button - Warning Banner Close */}
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
                        aria-label="Закрыть уведомление"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </Alert>
        </div>
    );
}
