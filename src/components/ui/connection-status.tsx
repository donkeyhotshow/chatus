"use client";

import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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

// Компонент для отображения в header чата
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
