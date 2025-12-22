'use client';

import { Firestore, doc, onSnapshot, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { TypingManager } from '@/lib/realtime';
import { UserProfile, Room } from "@/lib/types";
import { isDemoMode } from "@/lib/demo-mode";
import { logger } from "@/lib/logger";
import { getTabSyncService } from "./TabSyncService";

const HEARTBEAT_INTERVAL = 10000; // Heartbeat каждые 10 секунд

export class PresenceService {
    private firestore: Firestore;
    private roomId: string;
    private currentUser: UserProfile | null = null;

    public onlineUsers: UserProfile[] = [];
    public typingUsers: string[] = [];

    private typingManager: TypingManager | null = null;
    private roomUnsub: (() => void) | null = null;
    private notifyCallback: () => void;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private lastActivity: number = Date.now();
    private isVisible: boolean = true;
    private tabSync = getTabSyncService();

    // Store bound event handlers for cleanup
    private visibilityHandler: (() => void) | null = null;
    private focusHandler: (() => void) | null = null;
    private blurHandler: (() => void) | null = null;
    private unloadHandler: (() => void) | null = null;
    private tabSyncUnsubscribes: (() => void)[] = [];

    constructor(roomId: string, firestore: Firestore, notifyCallback: () => void) {
        this.roomId = roomId;
        this.firestore = firestore;
        this.notifyCallback = notifyCallback;

        this.setupVisibilityListener();
        this.setupBeforeUnloadListener();
        this.setupTabSyncListener();
    }

    private setupVisibilityListener() {
        if (typeof document === 'undefined') return;

        this.visibilityHandler = () => {
            this.isVisible = document.visibilityState === 'visible';

            if (this.isVisible) {
                // Вернулись на вкладку - обновляем присутствие
                this.updatePresence(true);
                this.startHeartbeat();
            } else {
                // Ушли с вкладки - можно замедлить heartbeat
                this.stopHeartbeat();
            }
        };

        this.focusHandler = () => {
            this.updatePresence(true);
        };

        this.blurHandler = () => {
            // При потере фокуса не сразу отмечаем offline, но обновляем lastSeen
            this.updateLastSeen();
        };

        document.addEventListener('visibilitychange', this.visibilityHandler);
        window.addEventListener('focus', this.focusHandler);
        window.addEventListener('blur', this.blurHandler);
    }

    private setupBeforeUnloadListener() {
        if (typeof window === 'undefined') return;

        this.unloadHandler = () => {
            this.markOffline();
        };

        window.addEventListener('beforeunload', this.unloadHandler);
        window.addEventListener('pagehide', this.unloadHandler);
        window.addEventListener('unload', this.unloadHandler);

        // Для мобильных устройств
        document.addEventListener('freeze', this.unloadHandler);
    }

    private setupTabSyncListener() {
        // Слушаем события присутствия от других вкладок
        const unsub1 = this.tabSync.subscribe('USER_ONLINE', (event) => {
            if (event.roomId === this.roomId) {
                // Обновляем локальный список онлайн пользователей
                this.refreshOnlineUsers();
            }
        });

        const unsub2 = this.tabSync.subscribe('USER_OFFLINE', (event) => {
            if (event.roomId === this.roomId) {
                const { userId } = event.payload;
                // Удаляем пользователя из списка
                this.onlineUsers = this.onlineUsers.filter(u => u.id !== userId);
                this.notifyCallback();
            }
        });

        this.tabSyncUnsubscribes.push(unsub1, unsub2);
    }

    setCurrentUser(user: UserProfile | null) {
        this.currentUser = user;
        if (user && !isDemoMode()) {
            this.typingManager = new TypingManager(this.roomId, user.id);
            this.initRealtimeSubscriptions();
            this.updatePresence(true);
            this.startHeartbeat();
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();

        this.heartbeatInterval = setInterval(() => {
            if (this.isVisible && this.currentUser) {
                this.updatePresence(true);
            }
        }, HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private async updatePresence(isOnline: boolean) {
        if (!this.currentUser || isDemoMode()) return;

        try {
            const presenceRef = doc(this.firestore, 'rooms', this.roomId, 'presence', this.currentUser.id);

            await setDoc(presenceRef, {
                oderId: this.currentUser.id,
                name: this.currentUser.name,
                avatar: this.currentUser.avatar,
                isOnline,
                lastSeen: serverTimestamp(),
                tabId: this.tabSync.getTabId(),
            }, { merge: true });

            // Уведомляем другие вкладки
            this.tabSync.broadcastPresence(this.roomId, this.currentUser.id, isOnline);

            this.lastActivity = Date.now();
        } catch (error) {
            // Don't crash the app on presence errors - just log and continue
            logger.warn("Failed to update presence (non-critical)", error as Error);
        }
    }

    private async updateLastSeen() {
        if (!this.currentUser || isDemoMode()) return;

        try {
            const presenceRef = doc(this.firestore, 'rooms', this.roomId, 'presence', this.currentUser.id);
            await updateDoc(presenceRef, {
                lastSeen: serverTimestamp(),
            });
        } catch {
            // Игнорируем ошибки при обновлении lastSeen
        }
    }

    private async markOffline() {
        if (!this.currentUser || isDemoMode()) return;

        try {
            // Используем sendBeacon для надёжной отправки при закрытии
            const presenceRef = doc(this.firestore, 'rooms', this.roomId, 'presence', this.currentUser.id);

            // Синхронный вызов для beforeunload
            await updateDoc(presenceRef, {
                isOnline: false,
                lastSeen: serverTimestamp(),
            });

            // Уведомляем другие вкладки
            this.tabSync.broadcastPresence(this.roomId, this.currentUser.id, false);
        } catch {
            // Игнорируем ошибки при закрытии
        }
    }

    private refreshOnlineUsers() {
        // Принудительно обновляем список онлайн пользователей
        // Это вызывается при получении события от другой вкладки
    }

    initListeners() {
        if (isDemoMode()) {
            this.onlineUsers = this.currentUser ? [this.currentUser] : [];
            this.notifyCallback();
            return;
        }

        // Слушаем изменения в комнате
        this.roomUnsub = onSnapshot(doc(this.firestore, 'rooms', this.roomId), (snapshot) => {
            if (snapshot.exists()) {
                const roomData = snapshot.data() as Room;
                this.onlineUsers = roomData.participantProfiles || [];
                this.notifyCallback();
            }
        }, (error) => {
            logger.error("Room listener error", error);
        });
    }

    private initRealtimeSubscriptions() {
        if (!this.currentUser || !this.typingManager) return;

        this.typingManager.subscribeToTyping((typingUsers) => {
            const typingUsernames = typingUsers
                .map(userId => this.onlineUsers.find(u => u.id === userId)?.name)
                .filter(Boolean) as string[];

            this.typingUsers = typingUsernames;
            this.notifyCallback();
        });
    }

    sendTyping() {
        if (this.typingManager) {
            this.typingManager.sendTyping();
            // Также уведомляем через TabSync
            if (this.currentUser) {
                this.tabSync.broadcastTyping(this.roomId, this.currentUser.id, true);
            }
        }
    }

    stopTyping() {
        if (this.typingManager) {
            this.typingManager.stopTyping();
            // Также уведомляем через TabSync
            if (this.currentUser) {
                this.tabSync.broadcastTyping(this.roomId, this.currentUser.id, false);
            }
        }
    }

    disconnect() {
        // Отмечаем offline перед отключением
        this.markOffline();

        this.stopHeartbeat();

        if (this.roomUnsub) {
            this.roomUnsub();
            this.roomUnsub = null;
        }
        if (this.typingManager) {
            this.typingManager.disconnect();
            this.typingManager = null;
        }

        // Cleanup event listeners
        if (typeof document !== 'undefined' && this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        if (typeof window !== 'undefined') {
            if (this.focusHandler) window.removeEventListener('focus', this.focusHandler);
            if (this.blurHandler) window.removeEventListener('blur', this.blurHandler);
            if (this.unloadHandler) {
                window.removeEventListener('beforeunload', this.unloadHandler);
                window.removeEventListener('pagehide', this.unloadHandler);
                window.removeEventListener('unload', this.unloadHandler);
            }
        }
        if (typeof document !== 'undefined' && this.unloadHandler) {
            document.removeEventListener('freeze', this.unloadHandler);
        }

        // Cleanup tab sync subscriptions
        this.tabSyncUnsubscribes.forEach(unsub => unsub());
        this.tabSyncUnsubscribes = [];

        this.onlineUsers = [];
        this.typingUsers = [];
    }
}
