"use client";

import { useEffect, useState, useCallback } from 'react';
import {
    CheckCircle, AlertCircle, XCircle, Info, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastNotificationProps {
    toast: ToastNotification;
    onDismiss: (id: string) => void;
}

const toastIcons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

const toastStyles = {
    success: 'bg-green-900/90 border-green-500/50 text-green-100',
    error: 'bg-red-900/90 border-red-500/50 text-red-100',
    warning: 'bg-yellow-900/90 border-yellow-500/50 text-yellow-100',
    info: 'bg-blue-900/90 border-blue-500/50 text-blue-100',
};

export function ToastNotificationComponent({ toast, onDismiss }: ToastNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const Icon = toastIcons[toast.type];

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(toast.id);
        }, 300);
    }, [onDismiss, toast.id]);

    useEffect(() => {
        // Animate in
        const timer = setTimeout(() => setIsVisible(true), 50);

        // Auto dismiss
        if (toast.duration && toast.duration > 0) {
            const dismissTimer = setTimeout(() => {
                handleDismiss();
            }, toast.duration);

            return () => {
                clearTimeout(timer);
                clearTimeout(dismissTimer);
            };
        }

        return () => clearTimeout(timer);
    }, [toast.duration, handleDismiss]);

    const handleAction = () => {
        if (toast.action) {
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
            toast.action.onClick();
        }
    };

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform max-w-sm w-full",
                toastStyles[toast.type],
                isVisible && !isExiting ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
            )}
        >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{toast.title}</div>
                {toast.description && (
                    <div className="text-xs opacity-90 mt-1">{toast.description}</div>
                )}

                {toast.action && (
                    <button
                        onClick={handleAction}
                        className="mt-2 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 active:scale-95"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-all duration-200 active:scale-95"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// Toast Container
interface ToastContainerProps {
    toasts: ToastNotification[];
    onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastNotificationComponent toast={toast} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
}

// Hook for managing toasts
export function useToastNotifications() {
    const [toasts, setToasts] = useState<ToastNotification[]>([]);

    const addToast = (toast: Omit<ToastNotification, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: ToastNotification = {
            ...toast,
            id,
            duration: toast.duration ?? 4000,
        };

        setToasts(prev => [...prev, newToast]);

        // Haptic feedback
        if ('vibrate' in navigator) {
            const vibrationPattern = {
                success: [10],
                error: [100, 50, 100],
                warning: [50, 25, 50],
                info: [10],
            };
            navigator.vibrate(vibrationPattern[toast.type]);
        }

        return id;
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const dismissAll = () => {
        setToasts([]);
    };

    return {
        toasts,
        addToast,
        dismissToast,
        dismissAll,
    };
}
