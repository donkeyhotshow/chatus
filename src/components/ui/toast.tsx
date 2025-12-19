"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastActionElement = React.ReactElement;

export interface ToastProps {
    id: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    variant?: 'default' | 'destructive' | 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

type Toast = ToastProps;

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const toastConfig = {
    success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-950/50', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200' },
    error: { icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-950/50', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-950/50', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200' },
    info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' }
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const duration = toast.duration || 4000;
    const type = toast.type || (toast.variant === 'destructive' ? 'error' : (toast.variant as keyof typeof toastConfig)) || 'info';
    const config = toastConfig[type] || toastConfig.info;
    const Icon = config.icon;

    React.useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), duration);
        return () => clearTimeout(timer);
    }, [toast.id, duration, onRemove]);

    return (
        <div className={cn(
            "relative overflow-hidden rounded-lg border shadow-md max-w-sm w-full animate-slide-up",
            config.bg, config.border
        )}>
            <div className="p-3">
                <div className="flex items-start gap-3">
                    <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", config.text)} />

                    <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", config.text)}>{toast.title}</p>
                        {toast.description && (
                            <p className={cn("text-xs mt-0.5 opacity-80", config.text)}>{toast.description}</p>
                        )}
                        {toast.action && (
                            <button
                                onClick={toast.action.onClick}
                                className={cn("mt-2 text-xs font-medium underline", config.text)}
                            >
                                {toast.action.label}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => onRemove(toast.id)}
                        className={cn("p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors", config.text)}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev.slice(-2), { ...toast, id }]); // Keep max 3 toasts
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((title: string, description?: string) => addToast({ type: 'success', title, description }), [addToast]);
    const error = useCallback((title: string, description?: string) => addToast({ type: 'error', title, description }), [addToast]);
    const warning = useCallback((title: string, description?: string) => addToast({ type: 'warning', title, description }), [addToast]);
    const info = useCallback((title: string, description?: string) => addToast({ type: 'info', title, description }), [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onRemove={removeToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
