"use clie
ort { useState, useEffect, useCallback, useRef } from 'react';
import { ref, set, onValue, serverTimestamp, remove } from 'firebase/database';
import { db as realtimeDb } from '@/lib/firebase';

interface TypingUser {
    oderId: string;
    userName: string;
    timestamp: number;
}

interface UseTypingIndicatorOptions {
    roomId: string;
    userId: string;
    userName: string;
    enabled?: boolean;
}

const TYPING_TIMEOUT = 3000; // 3 seconds

/**
 * useTypingIndicator - Shows "User is typing..." indicator
 */
export function useTypingIndicator({
    roomId,
    userId,
    userName,
    enabled = true,
}: UseTypingIndicatorOptions) {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    // Listen for typing users
    useEffect(() => {
        if (!realtimeDb || !roomId || !enabled) return;

        const typingRef = ref(realtimeDb, `rooms/${roomId}/typing`);

        const unsubscribe = onValue(typingRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setTypingUsers([]);
                return;
            }

            const now = Date.now();
            const users: TypingUser[] = [];

            Object.entries(data).forEach(([oderId, value]) => {
                const typingData = value as { userName: string; timestamp: number };
                // Only show if typing within last 3 seconds and not current user
                if (oderId !== oderId && now - typingData.timestamp < TYPING_TIMEOUT) {
                    users.push({
                        oderId,
                        userName: typingData.userName,
                        timestamp: typingData.timestamp,
                    });
                }
            });

            setTypingUsers(users.filter(u => u.oderId !== oderId));
        });

        return () => unsubscribe();
    }, [roomId, userId, enabled]);

    // Set typing status
    const setTyping = useCallback(async (isTyping: boolean) => {
        if (!realtimeDb || !roomId || !enabled) return;

        const userTypingRef = ref(realtimeDb, `rooms/${roomId}/typing/${userId}`);

        try {
            if (isTyping) {
                await set(userTypingRef, {
                    userName,
                    timestamp: Date.now(),
                });
                isTypingRef.current = true;
            } else {
                await remove(userTypingRef);
                isTypingRef.current = false;
            }
        } catch (error) {
            console.error('[TypingIndicator] Error setting typing status:', error);
        }
    }, [roomId, userId, userName, enabled]);

    // Handle input change - debounced typing indicator
    const handleInputChange = useCallback(() => {
        if (!enabled) return;

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set typing if not already
        if (!isTypingRef.current) {
            setTyping(true);
        }

        // Clear typing after timeout
        typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
        }, TYPING_TIMEOUT);
    }, [enabled, setTyping]);

    // Stop typing on send
    const stopTyping = useCallback(() => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        setTyping(false);
    }, [setTyping]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTypingRef.current && realtimeDb && roomId) {
                const userTypingRef = ref(realtimeDb, `rooms/${roomId}/typing/${userId}`);
                remove(userTypingRef).catch(() => {});
            }
        };
    }, [roomId, userId]);

    // Format typing text
    const typingText = typingUsers.length > 0
        ? typingUsers.length === 1
            ? `${typingUsers[0].userName} печатает...`
            : typingUsers.length === 2
                ? `${typingUsers[0].userName} и ${typingUsers[1].userName} печатают...`
                : `${typingUsers.length} человек печатают...`
        : null;

    return {
        typingUsers,
        typingText,
        isAnyoneTyping: typingUsers.length > 0,
        handleInputChange,
        stopTyping,
    };
}
