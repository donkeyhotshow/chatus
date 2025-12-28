/**
 * Loading States Components
 * Provides consistent loading indicators across the application
 * WCAG FIX: Improved contrast and accessibility
 */

import React from 'react';
import { Loader2, MessageCircle, Users, Image as ImageIcon, Send, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
    label = 'Загрузка...'
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    return (
        <div className="flex items-center gap-2" role="status" aria-label={label}>
            <Loader2
                className={cn(
                    'animate-spin text-violet-400',
                    sizeClasses[size],
                    className
                )}
                aria-hidden="true"
            />
            <span className="sr-only">{label}</span>
        </div>
    );
};

interface LoadingOverlayProps {
    isLoading: boolean;
    children: React.ReactNode;
    loadingText?: string;
    className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isLoading,
    children,
    loadingText = 'Загрузка...',
    className
}) => {
    return (
        <div className={cn('relative', className)}>
            {children}
            {isLoading && (
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex flex-col items-center gap-3 text-white">
                        <LoadingSpinner size="lg" />
                        <span className="text-sm font-medium">{loadingText}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Enhanced Loading with Progress Bar
 * Shows visual progress indicator
 */
interface ProgressLoadingProps {
    progress?: number;
    text?: string;
    showPercentage?: boolean;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
    progress = 0,
    text = 'Загрузка...',
    showPercentage = true
}) => {
    return (
        <div className="flex flex-col items-center gap-4 p-6" role="status" aria-live="polite">
            <div className="w-full max-w-xs">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-[var(--text-secondary)]">{text}</span>
                    {showPercentage && (
                        <span className="text-sm text-[var(--text-muted)]">{Math.round(progress)}%</span>
                    )}
                </div>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * Connection Loading State
 * For initial connection to chat/room
 */
export const ConnectionLoading: React.FC<{ roomCode?: string }> = ({ roomCode }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="relative">
                <div className="w-20 h-20 bg-violet-500/10 rounded-[32px] flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-violet-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--bg-primary)] rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Подключение к чату</h3>
                {roomCode && (
                    <p className="text-sm text-[var(--text-tertiary)]">
                        Комната: <span className="font-mono text-violet-400">{roomCode}</span>
                    </p>
                )}
                <p className="text-sm text-[var(--text-muted)]">
                    Загружаем сообщения и настраиваем соединение
                </p>
            </div>
        </div>
    );
};

interface MessageLoadingProps {
    count?: number;
}

export const MessageLoading: React.FC<MessageLoadingProps> = ({ count = 3 }) => {
    return (
        <div className="space-y-4 p-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-neutral-700 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-700 rounded w-1/4" />
                        <div className="h-3 bg-neutral-800 rounded w-3/4" />
                        <div className="h-3 bg-neutral-800 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const ChatLoading: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-violet-500/10 rounded-[32px] flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-violet-400 animate-pulse" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Подключение к чату...</h3>
                <p className="text-sm text-neutral-500">
                    Загружаем сообщения и настраиваем соединение
                </p>
            </div>
            <LoadingSpinner size="lg" />
        </div>
    );
};

export const UsersLoading: React.FC = () => {
    return (
        <div className="flex items-center gap-2 text-neutral-400">
            <Users className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Загрузка пользователей...</span>
        </div>
    );
};

export const ImageUploadLoading: React.FC = () => {
    return (
        <div className="flex items-center gap-2 text-violet-400">
            <ImageIcon className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Загрузка изображения...</span>
        </div>
    );
};

interface SendingMessageProps {
    progress?: number;
}

export const SendingMessage: React.FC<SendingMessageProps> = ({ progress }) => {
    return (
        <div className="flex items-center gap-2 text-neutral-400">
            <Send className="w-4 h-4 animate-pulse" />
            <span className="text-sm">
                {progress ? `Отправка... ${progress}%` : 'Отправка сообщения...'}
            </span>
        </div>
    );
};

interface ButtonLoadingProps {
    isLoading: boolean;
    children: React.ReactNode;
    loadingText?: string;
    className?: string;
    disabled?: boolean;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
    isLoading,
    children,
    loadingText,
    className,
    disabled
}) => {
    return (
        <button
            className={cn(
                'relative flex items-center justify-center gap-2 transition-all',
                isLoading && 'cursor-not-allowed opacity-70',
                className
            )}
            disabled={disabled || isLoading}
        >
            {isLoading && <LoadingSpinner size="sm" />}
            <span className={cn(isLoading && 'opacity-70')}>
                {isLoading && loadingText ? loadingText : children}
            </span>
        </button>
    );
};

interface SkeletonProps {
    className?: string;
    count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'animate-pulse bg-neutral-700 rounded',
                        className
                    )}
                />
            ))}
        </>
    );
};

// Specific loading states for different sections
export const RoomLoading: React.FC = () => {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-px w-full" />
            <MessageLoading count={5} />
        </div>
    );
};

export const ProfileLoading: React.FC = () => {
    return (
        <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    );
};
