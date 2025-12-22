"use client";

import { useCallback } from 'react';
import { useLocalStorage, localStorageUtils } from './use-local-storage';
import { Message } from '@/lib/types';

interface ChatPersistenceData {
    messages: Message[];
    lastUpdated: number;
    roomId: string;
}

interface UserPreferences {
    username: string;
    lastRoomId: string;
    theme: string;
    notifications: boolean;
}

const CHAT_HISTORY_PREFIX = 'chat-history-';
const USER_PREFERENCES_KEY = 'user-preferences';
const MAX_STORED_MESSAGES = 100; // Ограничиваем количество сохраняемых сообщений
const HISTORY_EXPIRY_DAYS = 7; // Храним историю 7 дней

export function useChatPersistence(roomId: string) {
    const storageKey = `${CHAT_HISTORY_PREFIX}${roomId}`;

    const [chatData, setChatData] = useLocalStorage<ChatPersistenceData | null>(storageKey, null);

    // Сохранение сообщений
    const saveMessages = useCallback((messages: Message[]) => {
        if (!messages || messages.length === 0) return;

        // Ограничиваем количество сохраняемых сообщений
        const messagesToSave = messages.slice(-MAX_STORED_MESSAGES);

        const dataToSave: ChatPersistenceData = {
            messages: messagesToSave,
            lastUpdated: Date.now(),
            roomId
        };

        setChatData(dataToSave);
    }, [roomId, setChatData]);

    // Загрузка сообщений
    const loadMessages = useCallback((): Message[] => {
        if (!chatData) return [];

        // Проверяем, не истекла ли история
        const now = Date.now();
        const expiryTime = HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        if (now - chatData.lastUpdated > expiryTime) {
            // История истекла - возвращаем пустой массив
            // НЕ вызываем setChatData здесь чтобы избежать бесконечного цикла
            return [];
        }

        // Проверяем, что это правильная комната
        if (chatData.roomId !== roomId) {
            return [];
        }

        return chatData.messages || [];
    }, [chatData, roomId]);

    // Очистка истории для конкретной комнаты
    const clearHistory = useCallback(() => {
        setChatData(null);
    }, [setChatData]);

    // Очистка всей истории чатов
    const clearAllHistory = useCallback(() => {
        if (typeof window === "undefined") return;

        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CHAT_HISTORY_PREFIX)) {
                localStorageUtils.remove(key);
            }
        });
    }, []);

    return {
        saveMessages,
        loadMessages,
        clearHistory,
        clearAllHistory,
        hasHistory: chatData !== null && chatData.messages.length > 0
    };
}

export function useUserPreferences() {
    const [preferences, setPreferences] = useLocalStorage<UserPreferences>(USER_PREFERENCES_KEY, {
        username: '',
        lastRoomId: '',
        theme: 'dark',
        notifications: true
    });

    const updateUsername = useCallback((username: string) => {
        setPreferences(prev => ({ ...prev, username }));
    }, [setPreferences]);

    const updateLastRoomId = useCallback((roomId: string) => {
        setPreferences(prev => ({ ...prev, lastRoomId: roomId }));
    }, [setPreferences]);

    const updateTheme = useCallback((theme: string) => {
        setPreferences(prev => ({ ...prev, theme }));
    }, [setPreferences]);

    const updateNotifications = useCallback((notifications: boolean) => {
        setPreferences(prev => ({ ...prev, notifications }));
    }, [setPreferences]);

    return {
        preferences,
        updateUsername,
        updateLastRoomId,
        updateTheme,
        updateNotifications
    };
}

// Утилиты для работы с историей чатов
export const chatPersistenceUtils = {
    // Получить список всех сохраненных комнат
    getAllRooms: (): string[] => {
        if (typeof window === "undefined") return [];

        const keys = Object.keys(localStorage);
        return keys
            .filter(key => key.startsWith(CHAT_HISTORY_PREFIX))
            .map(key => key.replace(CHAT_HISTORY_PREFIX, ''));
    },

    // Получить размер истории в байтах
    getHistorySize: (): number => {
        if (typeof window === "undefined") return 0;

        let totalSize = 0;
        const keys = Object.keys(localStorage);

        keys.forEach(key => {
            if (key.startsWith(CHAT_HISTORY_PREFIX)) {
                const value = localStorage.getItem(key);
                if (value) {
                    totalSize += value.length;
                }
            }
        });

        return totalSize;
    },

    // Очистить старые истории
    cleanupOldHistory: (): void => {
        if (typeof window === "undefined") return;

        const now = Date.now();
        const expiryTime = HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const keys = Object.keys(localStorage);

        keys.forEach(key => {
            if (key.startsWith(CHAT_HISTORY_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    if (data.lastUpdated && now - data.lastUpdated > expiryTime) {
                        localStorage.removeItem(key);
                    }
                } catch {
                    // Если не можем распарсить, удаляем
                    localStorage.removeItem(key);
                }
            }
        });
    }
};

// Автоматическая очистка при загрузке
if (typeof window !== "undefined") {
    // Запускаем очистку через 1 секунду после загрузки
    setTimeout(() => {
        chatPersistenceUtils.cleanupOldHistory();
    }, 1000);
}
