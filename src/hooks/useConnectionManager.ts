'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ConnectionState {
    isOnline: boolean;
    isConnected: boolean;
    reconnectAttempts: number;
    lastError: string | null;
}

interface UseConnectionManagerOptions {
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    onReconnect?: () => Promise<void>;
    onDisconnect?: () => void;
}

export function useConnectionManager(options: UseConnectionManagerOptions = {}) {
    const {
        maxReconnectAttempts = 5,
        reconnectDelay = 2000,
        onReconnect,
        onDisconnect
    } = options;

    const { toast } = useToast();
    const [state, setState] = useState<ConnectionState>({
        isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
        isConnected: true,
        reconnectAttempts: 0,
        lastError: null
    });

    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const isReconnectingRef = useRef(false);

    const showErrorToast = useCallback((message: string, isTemporary = true) => {
        toast({
            title: 'Ошибка подключения',
            description: message,
            variant: 'destructive',
            duration: isTemporary ? 3000 : undefined
        });
    }, [toast]);

    const showSuccessToast = useCallback(() => {
        toast({
            title: 'Подключение восстановлено',
            description: 'Все функции снова доступны',
            duration: 2000
        });
    }, [toast]);

    const attemptReconnect = useCallback(async () => {
        if (isReconnectingRef.current || state.reconnectAttempts >= maxReconnectAttempts) {
            return;
        }

        isReconnectingRef.current = true;

        setState(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1
        }));

        try {
            logger.info('Attempting to reconnect...', { attempt: state.reconnectAttempts + 1 });

            if (onReconnect) {
                await onReconnect();
            }

            setState(prev => ({
                ...prev,
                isConnected: true,
                lastError: null,
                reconnectAttempts: 0
            }));

            showSuccessToast();
            logger.info('Reconnection successful');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Reconnection failed', error as Error, { attempt: state.reconnectAttempts + 1 });

            setState(prev => ({
                ...prev,
                lastError: errorMessage
            }));

            if (state.reconnectAttempts + 1 >= maxReconnectAttempts) {
                showErrorToast('Не удалось восстановить подключение. Перезагрузите страницу.', false);
            } else {
                // Schedule next reconnect attempt
                reconnectTimeoutRef.current = setTimeout(() => {
                    attemptReconnect();
                }, reconnectDelay * Math.pow(2, state.reconnectAttempts)); // Exponential backoff
            }
        } finally {
            isReconnectingRef.current = false;
        }
    }, [state.reconnectAttempts, maxReconnectAttempts, onReconnect, showErrorToast, showSuccessToast, reconnectDelay]);

    const handleConnectionError = useCallback((error: Error) => {
        logger.error('Connection error detected', error);

        setState(prev => ({
            ...prev,
            isConnected: false,
            lastError: error.message
        }));

        // Don't show error toast if we're offline (network issue)
        if (state.isOnline) {
            showErrorToast('Потеряно соединение с сервером. Попытка переподключения...');

            // Start reconnection attempts
            if (!isReconnectingRef.current) {
                attemptReconnect();
            }
        }
    }, [state.isOnline, showErrorToast, attemptReconnect]);

    const handleConnectionSuccess = useCallback(() => {
        const wasDisconnected = !state.isConnected;

        setState(prev => ({
            ...prev,
            isConnected: true,
            reconnectAttempts: 0,
            lastError: null
        }));

        if (wasDisconnected) {
            showSuccessToast();
        }

        // Clear any pending reconnect attempts
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
        }
        isReconnectingRef.current = false;
    }, [state.isConnected, showSuccessToast]);

    // Handle browser online/offline events
    useEffect(() => {
        const handleOnline = () => {
            setState(prev => ({ ...prev, isOnline: true }));

            // If we were disconnected, try to reconnect
            if (!state.isConnected) {
                attemptReconnect();
            }
        };

        const handleOffline = () => {
            setState(prev => ({ ...prev, isOnline: false, isConnected: false }));

            if (onDisconnect) {
                onDisconnect();
            }

            showErrorToast('Нет подключения к интернету');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [state.isConnected, attemptReconnect, onDisconnect, showErrorToast]);

    return {
        ...state,
        handleConnectionError,
        handleConnectionSuccess,
        isReconnecting: isReconnectingRef.current
    };
}
