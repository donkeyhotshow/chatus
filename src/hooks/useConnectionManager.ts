import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface ConnectionManagerOptions {
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    onReconnect?: () => Promise<void>;
    onDisconnect?: () => void;
}

interface ConnectionState {
    isOnline: boolean;
    isConnected: boolean;
    isReconnecting: boolean;
    reconnectAttempts: number;
}

export const useConnectionManager = (options: ConnectionManagerOptions = {}) => {
    const {
        maxReconnectAttempts = 5,
        reconnectDelay = 2000,
        onReconnect,
        onDisconnect
    } = options;

    const [state, setState] = useState<ConnectionState>({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isConnected: true,
        isReconnecting: false,
        reconnectAttempts: 0,
    });

    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isReconnectingRef = useRef(false);
    const stateRef = useRef(state);

    // Keep stateRef in sync
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const handleReconnect = useCallback(async () => {
        const currentState = stateRef.current;
        if (isReconnectingRef.current || currentState.reconnectAttempts >= maxReconnectAttempts) {
            return;
        }

        isReconnectingRef.current = true;
        setState(prev => ({
            ...prev,
            isReconnecting: true,
            reconnectAttempts: prev.reconnectAttempts + 1
        }));

        try {
            if (onReconnect) {
                await onReconnect();
            }

            setState(prev => ({
                ...prev,
                isConnected: true,
                isReconnecting: false,
                reconnectAttempts: 0
            }));

            logger.info('Connection restored successfully');
        } catch (error) {
            logger.error('Reconnection failed', error as Error);

            const updatedState = stateRef.current;
            if (updatedState.reconnectAttempts < maxReconnectAttempts) {
                const delay = reconnectDelay * Math.pow(2, updatedState.reconnectAttempts);
                reconnectTimeoutRef.current = setTimeout(() => {
                    isReconnectingRef.current = false;
                    handleReconnect();
                }, delay);
            } else {
                setState(prev => ({
                    ...prev,
                    isReconnecting: false,
                    isConnected: false
                }));
                logger.error('Max reconnection attempts reached');
            }
        } finally {
            if (stateRef.current.reconnectAttempts >= maxReconnectAttempts || stateRef.current.isConnected) {
                isReconnectingRef.current = false;
            }
        }
    }, [maxReconnectAttempts, reconnectDelay, onReconnect]);

    // Handle online/offline events
    useEffect(() => {
        const handleOnline = () => {
            setState(prev => ({ ...prev, isOnline: true }));
            if (stateRef.current.reconnectAttempts > 0) {
                handleReconnect();
            }
        };

        const handleOffline = () => {
            setState(prev => ({ ...prev, isOnline: false, isConnected: false }));
            if (onDisconnect) {
                onDisconnect();
            }
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
    }, [handleReconnect, onDisconnect]);

    const handleConnectionError = useCallback((error: Error) => {
        logger.error('Connection error', error);
        setState(prev => ({ ...prev, isConnected: false }));

        const currentState = stateRef.current;
        if (currentState.isOnline && currentState.reconnectAttempts < maxReconnectAttempts) {
            handleReconnect();
        }
    }, [maxReconnectAttempts, handleReconnect]);

    const handleConnectionSuccess = useCallback(() => {
        setState(prev => ({
            ...prev,
            isConnected: true,
            isReconnecting: false,
            reconnectAttempts: 0
        }));
    }, []);

    return {
        ...state,
        handleConnectionError,
        handleConnectionSuccess,
        handleReconnect,
    };
};
