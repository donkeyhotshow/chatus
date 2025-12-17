"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface ConnectionState {
    isOnline: boolean;
    isConnected: boolean;
    isReconnecting: boolean;
    reconnectAttempts: number;
    lastConnected: Date | null;
}

interface ConnectionOptions {
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
    enableNotifications?: boolean;
}

export function useConnectionStatus(options: ConnectionOptions = {}) {
    const {
        maxReconnectAttempts = 5,
        reconnectInterval = 3000,
        enableNotifications = true
    } = options;

    const [connectionState, setConnectionState] = useState<ConnectionState>({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isConnected: true,
        isReconnecting: false,
        reconnectAttempts: 0,
        lastConnected: new Date()
    });

    const { toast } = useToast();
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);

    // Проверка соединения с сервером
    const checkConnection = useCallback(async (): Promise<boolean> => {
        try {
            // Пытаемся сделать запрос к серверу или проверить Firebase соединение
            const response = await fetch('/api/health', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch {
            return false;
        }
    }, []);

    // Попытка переподключения
    const attemptReconnect = useCallback(async () => {
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            setConnectionState(prev => ({
                ...prev,
                isReconnecting: false
            }));

            if (enableNotifications) {
                toast({
                    title: "Соединение потеряно",
                    description: "Не удалось восстановить соединение. Проверьте интернет-подключение.",
                    variant: "destructive"
                });
            }
            return;
        }

        setConnectionState(prev => ({
            ...prev,
            isReconnecting: true,
            reconnectAttempts: reconnectAttemptsRef.current + 1
        }));

        reconnectAttemptsRef.current += 1;

        const isConnected = await checkConnection();

        if (isConnected) {
            // Успешное переподключение
            reconnectAttemptsRef.current = 0;
            setConnectionState(prev => ({
                ...prev,
                isConnected: true,
                isReconnecting: false,
                reconnectAttempts: 0,
                lastConnected: new Date()
            }));

            if (enableNotifications) {
                toast({
                    title: "Соединение восстановлено",
                    description: "Подключение к серверу успешно восстановлено",
                    variant: "default"
                });
            }
        } else {
            // Неудачная попытка - планируем следующую
            const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff

            reconnectTimeoutRef.current = setTimeout(() => {
                attemptReconnect();
            }, Math.min(delay, 30000)); // Максимум 30 секунд между попытками
        }
    }, [maxReconnectAttempts, reconnectInterval, enableNotifications, checkConnection, toast]);

    // Обработка изменения онлайн статуса
    const handleOnlineStatusChange = useCallback(() => {
        const isOnline = navigator.onLine;

        setConnectionState(prev => ({
            ...prev,
            isOnline
        }));

        if (isOnline) {
            // Когда интернет появился, проверяем соединение с сервером
            checkConnection().then(isConnected => {
                if (isConnected) {
                    reconnectAttemptsRef.current = 0;
                    setConnectionState(prev => ({
                        ...prev,
                        isConnected: true,
                        isReconnecting: false,
                        reconnectAttempts: 0,
                        lastConnected: new Date()
                    }));
                } else {
                    // Начинаем попытки переподключения
                    attemptReconnect();
                }
            });
        } else {
            // Интернет пропал
            setConnectionState(prev => ({
                ...prev,
                isConnected: false,
                isReconnecting: false
            }));

            if (enableNotifications) {
                toast({
                    title: "Нет интернет-соединения",
                    description: "Проверьте подключение к интернету",
                    variant: "destructive"
                });
            }
        }
    }, [checkConnection, attemptReconnect, enableNotifications, toast]);

    // Принудительная проверка соединения
    const forceReconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        attemptReconnect();
    }, [attemptReconnect]);

    // Сброс счетчика попыток
    const resetReconnectAttempts = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        setConnectionState(prev => ({
            ...prev,
            reconnectAttempts: 0,
            isReconnecting: false
        }));
    }, []);

    // Установка обработчиков событий
    useEffect(() => {
        window.addEventListener('online', handleOnlineStatusChange);
        window.addEventListener('offline', handleOnlineStatusChange);

        // Периодическая проверка соединения
        const intervalId = setInterval(async () => {
            if (connectionState.isOnline && !connectionState.isReconnecting) {
                const isConnected = await checkConnection();

                if (!isConnected && connectionState.isConnected) {
                    // Соединение потеряно
                    setConnectionState(prev => ({
                        ...prev,
                        isConnected: false
                    }));

                    attemptReconnect();
                }
            }
        }, 10000); // Проверяем каждые 10 секунд

        return () => {
            window.removeEventListener('online', handleOnlineStatusChange);
            window.removeEventListener('offline', handleOnlineStatusChange);
            clearInterval(intervalId);

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [handleOnlineStatusChange, checkConnection, attemptReconnect, connectionState.isOnline, connectionState.isReconnecting, connectionState.isConnected]);

    // Обработка видимости страницы
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && connectionState.isOnline && !connectionState.isConnected) {
                // Страница стала видимой и есть проблемы с соединением
                forceReconnect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [connectionState.isOnline, connectionState.isConnected, forceReconnect]);

    return {
        connectionState,
        forceReconnect,
        resetReconnectAttempts,
        isHealthy: connectionState.isOnline && connectionState.isConnected && !connectionState.isReconnecting
    };
}
