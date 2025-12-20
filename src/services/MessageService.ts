'use client';

import {
    collection, query, orderBy, onSnapshot, addDoc,
    serverTimestamp, Unsubscribe, deleteDoc, doc, limit, getDocs, DocumentSnapshot, startAfter, Timestamp, DocumentData, Firestore, runTransaction, arrayUnion, arrayRemove, writeBatch
} from "firebase/firestore";
import { logger } from "@/lib/logger";
import { Message, UserProfile } from "@/lib/types";
import { withRetryAndTimeout } from "@/lib/utils";
import { isDemoMode } from "@/lib/demo-mode";

const MESSAGE_PAGE_SIZE = 30;

export class MessageService {
    private firestore: Firestore;
    private roomId: string;
    private currentUser: UserProfile | null = null;

    public messages: Message[] = [];
    public hasMoreMessages: boolean = true;
    public isInitialLoad: boolean = true;

    private firstMessageSnapshot: DocumentSnapshot | null = null;
    private lastMessageSnapshot: DocumentSnapshot | null = null;
    private isFetchingMore: boolean = false;
    private newestMessageListenerUnsub: Unsubscribe | null = null;
    private pendingNewMessages: Message[] = [];
    private newMessagesProcessingScheduled = false;
    private receivedMessageIds = new Set<string>();
    private sentMessageIds = new Set<string>();

    private notifyCallback: () => void;

    constructor(roomId: string, firestore: Firestore, notifyCallback: () => void) {
        this.roomId = roomId;
        this.firestore = firestore;
        this.notifyCallback = notifyCallback;
    }

    setCurrentUser(user: UserProfile | null) {
        this.currentUser = user;
    }

    async loadInitialMessages() {
        if (isDemoMode()) {
            this.isInitialLoad = false;
            this.messages = [];
            this.hasMoreMessages = false;
            this.notifyCallback();
            return;
        }

        try {
            const messagesRef = collection(this.firestore, 'rooms', this.roomId, 'messages');
            const qInitial = query(messagesRef, orderBy('createdAt', 'desc'), limit(MESSAGE_PAGE_SIZE));

            const documentSnapshots = await withRetryAndTimeout(
                () => getDocs(qInitial),
                { timeoutMs: 30_000, attempts: 3, backoffMs: 500 }
            ).catch(() => null);

            const docsArray = documentSnapshots && 'docs' in documentSnapshots ? documentSnapshots.docs : [];

            const initialMessages = docsArray.map((doc: DocumentSnapshot<DocumentData>) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    senderId: (data as any)?.senderId || (data as any)?.user?.id || '',
                } as Message;
            });

            if (docsArray.length > 0) {
                this.firstMessageSnapshot = docsArray[0];
                this.lastMessageSnapshot = docsArray[docsArray.length - 1];
            }

            this.hasMoreMessages = initialMessages.length === MESSAGE_PAGE_SIZE;
            this.messages = initialMessages.reverse();
            this.isInitialLoad = false;

            this.setupNewMessagesListener();
            this.notifyCallback();
        } catch (error) {
            logger.error("Error loading initial messages", error as Error);
            this.isInitialLoad = false;
            this.notifyCallback();
        }
    }

    private setupNewMessagesListener() {
        if (this.newestMessageListenerUnsub) this.newestMessageListenerUnsub();
        if (isDemoMode()) return;

        const messagesRef = collection(this.firestore, 'rooms', this.roomId, 'messages');
        let qNew;
        if (this.firstMessageSnapshot) {
            qNew = query(messagesRef, orderBy('createdAt', 'asc'), startAfter(this.firstMessageSnapshot));
        } else {
            qNew = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
        }

        this.newestMessageListenerUnsub = onSnapshot(qNew, (snapshot) => {
            if (snapshot.empty) return;

            snapshot.docs.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const msg: Message = {
                    id: docSnapshot.id,
                    ...data,
                    senderId: (data as any)?.senderId || (data as any)?.user?.id || '',
                    reactions: (data as any)?.reactions || [],
                    delivered: (data as any)?.delivered ?? false,
                    seen: (data as any)?.seen ?? false,
                } as Message;

                const dedupeKey = msg.id || (msg as any).clientMessageId;
                if (dedupeKey && this.receivedMessageIds.has(dedupeKey)) return;
                if (dedupeKey) this.receivedMessageIds.add(dedupeKey);

                this.pendingNewMessages.push(msg);
            });

            if (!this.newMessagesProcessingScheduled) {
                this.newMessagesProcessingScheduled = true;
                setTimeout(() => this.processPendingNewMessages(), 0);
            }
        });
    }

    private processPendingNewMessages() {
        this.newMessagesProcessingScheduled = false;
        if (this.pendingNewMessages.length === 0) return;

        const messageMap = new Map<string, Message>();
        this.messages.forEach(m => messageMap.set(m.id, m));
        this.pendingNewMessages.forEach(m => messageMap.set(m.id, m));

        this.messages = Array.from(messageMap.values()).sort((a, b) =>
            (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
        );

        this.pendingNewMessages = [];
        this.notifyCallback();
    }

    async loadMoreMessages() {
        if (!this.hasMoreMessages || this.isFetchingMore) return;
        this.isFetchingMore = true;

        try {
            const messagesRef = collection(this.firestore, 'rooms', this.roomId, 'messages');
            const q = query(
                messagesRef,
                orderBy('createdAt', 'desc'),
                startAfter(this.lastMessageSnapshot),
                limit(MESSAGE_PAGE_SIZE)
            );

            const documentSnapshots = await getDocs(q);
            const olderDocs = documentSnapshots.docs;
            const olderMessages = olderDocs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));

            if (olderDocs.length > 0) {
                this.lastMessageSnapshot = olderDocs[olderDocs.length - 1];
                this.messages = [...olderMessages.reverse(), ...this.messages];
                this.hasMoreMessages = olderMessages.length === MESSAGE_PAGE_SIZE;
                this.notifyCallback();
            }
        } catch (error) {
            logger.error("Error loading more messages", error as Error);
        } finally {
            this.isFetchingMore = false;
        }
    }

    async sendMessage(messageData: any, clientMessageId?: string) {
        if (!this.currentUser) {
            logger.warn('Cannot send message: no current user');
            return;
        }

        const msgId = clientMessageId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (this.sentMessageIds.has(msgId)) return;
        this.sentMessageIds.add(msgId);

        if (isDemoMode()) {
            const demoMessage: Message = {
                id: msgId,
                ...messageData,
                senderId: this.currentUser.id,
                createdAt: Timestamp.now(),
                reactions: [],
                delivered: true,
                seen: true,
            };
            this.messages = [...this.messages, demoMessage].sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
            this.notifyCallback();
            return;
        }

        // Optimistic update - показуємо повідомлення одразу
        const optimisticMessage: Message = {
            id: msgId,
            ...messageData,
            senderId: this.currentUser.id,
            createdAt: Timestamp.now(),
            reactions: [],
            delivered: false,
            seen: false,
            _pending: true,
        } as Message & { _pending?: boolean };

        this.messages = [...this.messages, optimisticMessage];
        this.notifyCallback();

        try {
            // Retry logic з exponential backoff
            await withRetryAndTimeout(
                () => addDoc(collection(this.firestore, 'rooms', this.roomId, 'messages'), {
                    ...messageData,
                    senderId: this.currentUser!.id,
                    clientMessageId: msgId,
                    createdAt: serverTimestamp(),
                    reactions: [],
                    delivered: false,
                    seen: false,
                }),
                { timeoutMs: 15_000, attempts: 3, backoffMs: 1000 }
            );
        } catch (error) {
            // Видаляємо optimistic повідомлення при помилці
            this.messages = this.messages.filter(m => m.id !== msgId);
            this.sentMessageIds.delete(msgId);
            this.notifyCallback();

            logger.error('Failed to send message after retries', error as Error, { roomId: this.roomId });
            throw error;
        }
    }

    async deleteMessage(messageId: string) {
        if (isDemoMode()) {
            this.messages = this.messages.filter(m => m.id !== messageId);
            this.notifyCallback();
            return;
        }

        try {
            await deleteDoc(doc(this.firestore, 'rooms', this.roomId, 'messages', messageId));
        } catch (error) {
            logger.error("Error deleting message", error as Error);
        }
    }

    async toggleReaction(messageId: string, emoji: string, user: UserProfile) {
        if (isDemoMode()) {
            this.messages = this.messages.map(m => {
                if (m.id === messageId) {
                    const reactions = m.reactions || [];
                    const existing = reactions.find(r => r.emoji === emoji && r.userId === user.id);
                    if (existing) {
                        return { ...m, reactions: reactions.filter(r => r !== existing) };
                    } else {
                        return { ...m, reactions: [...reactions, { emoji, userId: user.id, username: user.name }] };
                    }
                }
                return m;
            });
            this.notifyCallback();
            return;
        }

        const messageRef = doc(this.firestore, 'rooms', this.roomId, 'messages', messageId);
        await runTransaction(this.firestore, async (transaction) => {
            const messageDoc = await transaction.get(messageRef);
            if (!messageDoc.exists()) return;

            const reactions = (messageDoc.data()?.reactions || []) as any[];
            const existingIndex = reactions.findIndex(r => r.emoji === emoji && r.userId === user.id);

            if (existingIndex > -1) {
                transaction.update(messageRef, {
                    reactions: arrayRemove(reactions[existingIndex])
                });
            } else {
                transaction.update(messageRef, {
                    reactions: arrayUnion({ emoji, userId: user.id, username: user.name })
                });
            }
        });
    }

    async markMessagesAsSeen() {
        if (!this.currentUser || isDemoMode()) return;

        const batch = writeBatch(this.firestore);
        let hasUpdates = false;

        this.messages.forEach(msg => {
            if (msg.senderId !== this.currentUser?.id && !msg.seen) {
                const msgRef = doc(this.firestore, 'rooms', this.roomId, 'messages', msg.id);
                batch.update(msgRef, { seen: true, delivered: true });
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            try {
                await batch.commit();
            } catch (error) {
                logger.error("Error marking messages as seen", error as Error);
            }
        }
    }

    async markMessagesAsDelivered() {
        if (!this.currentUser || isDemoMode()) return;

        const batch = writeBatch(this.firestore);
        let hasUpdates = false;

        this.messages.forEach(msg => {
            if (msg.senderId !== this.currentUser?.id && !msg.delivered) {
                const msgRef = doc(this.firestore, 'rooms', this.roomId, 'messages', msg.id);
                batch.update(msgRef, { delivered: true });
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            try {
                await batch.commit();
            } catch (error) {
                logger.error("Error marking messages as delivered", error as Error);
            }
        }
    }

    disconnect() {
        if (this.newestMessageListenerUnsub) {
            this.newestMessageListenerUnsub();
            this.newestMessageListenerUnsub = null;
        }
        this.messages = [];
        this.receivedMessageIds.clear();
        this.sentMessageIds.clear();
    }
}
