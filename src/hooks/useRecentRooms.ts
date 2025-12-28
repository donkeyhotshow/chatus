"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { chatPersistenceUtils } from './use-chat-persistence';

const RECENT_ROOMS_KEY = 'recent-rooms';
const MAX_RECENT_ROOMS = 9; // Для Ctrl+1-9

interface RecentRoom {
    id: string;
    lastVisited: number;
    name?: string;
}

/**
 * useRecentRooms - Хук для управления недавними комнатами
 * Этап 4: Навигация по чатам Ctrl/Cmd+1-9
 */
export function useRecentRooms() {
    const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
    const router = useRouter();

    // Загрузка из localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(RECENT_ROOMS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as RecentRoom[];
                setRecentRooms(parsed.slice(0, MAX_RECENT_ROOMS));
            } else {
                // Fallback: получить из истории чатов
                const allRooms = chatPersistenceUtils.getAllRooms();
                const rooms: RecentRoom[] = allRooms.map(id => ({
                    id,
                    lastVisited: Date.now(),
                })).slice(0, MAX_RECENT_ROOMS);
                setRecentRooms(rooms);
            }
        } catch {
            setRecentRooms([]);
        }
    }, []);

    // Сохранение в localStorage
    const saveRooms = useCallback((rooms: RecentRoom[]) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(rooms));
        } catch {
            // Ignore storage errors
        }
    }, []);

    // Добавить/обновить комнату
    const addRoom = useCallback((roomId: string, name?: string) => {
        setRecentRooms(prev => {
            const filtered = prev.filter(r => r.id !== roomId);
            const newRoom: RecentRoom = {
                id: roomId,
                lastVisited: Date.now(),
                name,
            };
            const updated = [newRoom, ...filtered].slice(0, MAX_RECENT_ROOMS);
            saveRooms(updated);
            return updated;
        });
    }, [saveRooms]);

    // Удалить комнату
    const removeRoom = useCallback((roomId: string) => {
        setRecentRooms(prev => {
            const updated = prev.filter(r => r.id !== roomId);
            saveRooms(updated);
            return updated;
        });
    }, [saveRooms]);

    // Навигация по индексу (0-8 для Ctrl+1-9)
    const navigateToRoom = useCallback((index: number) => {
        if (index < 0 || index >= recentRooms.length) return false;

        const room = recentRooms[index];
        if (room) {
            router.push(`/chat/${encodeURIComponent(room.id)}`);
            return true;
        }
        return false;
    }, [recentRooms, router]);

    return {
        recentRooms,
        addRoom,
        removeRoom,
        navigateToRoom,
    };
}
