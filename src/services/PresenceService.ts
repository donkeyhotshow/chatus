'use client';

import { Firestore, doc, onSnapshot } from "firebase/firestore";
import { TypingManager } from '@/lib/realtime';
import { UserProfile, Room } from "@/lib/types";
import { isDemoMode } from "@/lib/demo-mode";
import { logger } from "@/lib/logger";

export class PresenceService {
    private firestore: Firestore;
    private roomId: string;
    private currentUser: UserProfile | null = null;

    public onlineUsers: UserProfile[] = [];
    public typingUsers: string[] = [];

    private typingManager: TypingManager | null = null;
    private roomUnsub: (() => void) | null = null;
    private notifyCallback: () => void;

    constructor(roomId: string, firestore: Firestore, notifyCallback: () => void) {
        this.roomId = roomId;
        this.firestore = firestore;
        this.notifyCallback = notifyCallback;
    }

    setCurrentUser(user: UserProfile | null) {
        this.currentUser = user;
        if (user && !isDemoMode()) {
            this.typingManager = new TypingManager(this.roomId, user.id);
            this.initRealtimeSubscriptions();
        }
    }

    initListeners() {
        if (isDemoMode()) {
            this.onlineUsers = this.currentUser ? [this.currentUser] : [];
            this.notifyCallback();
            return;
        }

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
        }
    }

    stopTyping() {
        if (this.typingManager) {
            this.typingManager.stopTyping();
        }
    }

    disconnect() {
        if (this.roomUnsub) {
            this.roomUnsub();
            this.roomUnsub = null;
        }
        if (this.typingManager) {
            this.typingManager.disconnect();
            this.typingManager = null;
        }
        this.onlineUsers = [];
        this.typingUsers = [];
    }
}
