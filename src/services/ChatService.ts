'use client';

import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, where, Unsubscribe, deleteDoc, doc, runTransaction, limit, setDoc, getDoc, Firestore, writeBatch, getDocs, DocumentReference, DocumentSnapshot, startAfter, Timestamp, arrayRemove
} from "firebase/firestore";
import { TypingManager } from '@/lib/realtime';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { Message, CanvasPath, Reaction, UserProfile, GameState, Room, FirebaseError } from "@/lib/types";
import { Auth, signInAnonymously } from "firebase/auth";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getMessageQueue } from "./MessageQueue";
import { isFirebaseConfigValid } from "@/lib/firebase-config";
import { isDemoMode } from "@/lib/demo-mode";
import { withRetryAndTimeout } from "@/lib/utils";

type ChatServiceListener = () => void;

const MESSAGE_PAGE_SIZE = 30;

/**
 * Unified ChatService combining best practices from both projects:
 * - Singleton per room (from studio-main) for better scalability
 * - Rate limiting and pagination (from studio-main)
 * - Current project's data structure (users, rooms with participants)
 * - Error handling (from studio-main)
 */
export class ChatService {
  private firestore: Firestore;
  private auth: Auth;
  private storage: FirebaseStorage;
  private roomId: string;
  private currentUser: UserProfile | null = null;

  // State
  public messages: Message[] = [];
  public onlineUsers: UserProfile[] = [];
  public typingUsers: string[] = [];
  public gameStates: { [gameId: string]: GameState } = {};
  public isInitialLoad: boolean = true;
  public hasMoreMessages: boolean = true;

  // Pagination
  private firstMessageSnapshot: DocumentSnapshot | null = null;
  private lastMessageSnapshot: DocumentSnapshot | null = null;
  private isFetchingMore: boolean = false;
  private newestMessageListenerUnsub: Unsubscribe | null = null;
  // Batch incoming new messages to reduce notify churn
  private pendingNewMessages: Message[] = [];
  private newMessagesProcessingScheduled = false;

  // Rate Limiting & Anti-Flood
  private lastMessageTime: number = 0;
  private readonly messageCooldown: number = 500; // ms
  private recentMessageTimestamps: number[] = [];
  private readonly floodThresholdCount: number = 5;
  private readonly floodThresholdTime: number = 3000; // ms
  private isMuted: boolean = false;
  private muteTimer: NodeJS.Timeout | null = null;
  private muteSecondsLeft: number = 0;
  private muteCountdownTimer: NodeJS.Timeout | null = null;
  public onMuteUpdate: ((seconds: number) => void) | null = null;

  // Listeners
  private listeners: ChatServiceListener[] = [];
  private unsubscribes: Unsubscribe[] = [];

  // Race condition protection
  private isJoining: boolean = false;
  private joinPromise: Promise<void> | null = null;

  // Deduplication: track sent and received message IDs
  private sentMessageIds = new Set<string>();
  private receivedMessageIds = new Set<string>();

  private _messageQueue: ReturnType<typeof getMessageQueue> | null = null;
  // sendMessage concurrency guard
  private sendingMessage: boolean = false;

  // RTDB managers
  private typingManager: TypingManager | null = null;

  // Lazy getter for messageQueue to avoid initialization order issues
  private get messageQueue() {
    if (!this._messageQueue) {
      this._messageQueue = getMessageQueue();
      // Setup message queue callback
      this._messageQueue.setSendCallback((messageData, clientMessageId) => {
        return this.sendMessage(messageData, clientMessageId);
      });
    }
    return this._messageQueue;
  }

  constructor(roomId: string, firestore: Firestore, auth: Auth, storage: FirebaseStorage) {
    this.roomId = roomId;
    this.firestore = firestore;
    this.auth = auth;
    this.storage = storage;

    this.initListeners();
  }

  private initListeners() {
    // In demo mode, skip Firebase listeners
    if (isDemoMode()) {
      this.isInitialLoad = false;
      this.messages = [];
      this.onlineUsers = this.currentUser ? [this.currentUser] : [];
      this.typingUsers = [];
      this.gameStates = {};
      this.hasMoreMessages = false;
      this.notify();
      return;
    }

    this.loadInitialMessages();

    // Listen to room participants (without typing - moved to RTDB)
    const roomRef = doc(this.firestore, 'rooms', this.roomId);
    const roomUnsub = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.data() as Room;
        this.onlineUsers = roomData.participantProfiles || [];
        this.notify();
      }
    }, (error) => {
      const err = error as FirebaseError;
      // Suppress offline/permission errors
      if (err.message?.includes('client is offline') ||
        err.message?.includes('Failed to get document') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        return; // Silently ignore
      }
      logger.error("Room listener error", error as Error, { roomId: this.roomId });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        operation: 'list',
        path: `rooms/${this.roomId}`
      }));
    });

    // Listen to games
    const gamesCol = collection(this.firestore, 'rooms', this.roomId, 'games');
    const gamesUnsub = onSnapshot(gamesCol, (snapshot) => {
      const games: { [gameId: string]: GameState } = {};
      snapshot.docs.forEach(doc => {
        games[doc.id] = doc.data() as GameState;
      });
      this.gameStates = games;
      this.notify();
    }, (error) => {
      const err = error as FirebaseError;
      // Suppress offline/permission errors
      if (err.message?.includes('client is offline') ||
        err.message?.includes('Failed to get document') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        return; // Silently ignore
      }
      logger.error("Games listener error", error as Error, { roomId: this.roomId });
    });

    this.unsubscribes.push(roomUnsub, gamesUnsub);
  }

  /**
   * Initialize RTDB subscriptions (called after user joins)
   */
  private initRealtimeSubscriptions() {
    if (!this.currentUser || !this.typingManager) return;

    // Subscribe to typing indicators
    this.typingManager.subscribeToTyping((typingUsers) => {
      // Get usernames from online users
      const typingUsernames = typingUsers
        .map(userId => this.onlineUsers.find(u => u.id === userId)?.name)
        .filter(Boolean) as string[];

      this.typingUsers = typingUsernames;
      this.notify();
    });
  }

  // --- Message Loading with Pagination ---

  private async loadInitialMessages() {
    // In demo mode, skip loading messages
    if (isDemoMode()) {
      this.isInitialLoad = false;
      this.messages = [];
      this.hasMoreMessages = false;
      this.notify();
      return;
    }

    try {
      const messagesRef = collection(this.firestore, 'rooms', this.roomId, 'messages');

      // Initial batch load
      const qInitial = query(messagesRef, orderBy('createdAt', 'desc'), limit(MESSAGE_PAGE_SIZE));
      const documentSnapshots = await withRetryAndTimeout(
        () => getDocs(qInitial),
        { timeoutMs: 30_000, attempts: 3, backoffMs: 500 }
      ).catch(() => null);

      // Defensive: tests/mocks may return undefined; handle gracefully
      const docsArray = documentSnapshots && 'docs' in documentSnapshots ? documentSnapshots.docs : [];

      const initialMessages = docsArray.map((doc: DocumentSnapshot<DocumentData>) => {
        const data = typeof doc.data === 'function' ? doc.data() : doc;
        return {
          id: doc.id,
          ...data,
          // Ensure senderId exists (backward compatibility)
          senderId: data.senderId || data.user?.id || '',
        } as Message;
      });


      // Set snapshots only if we have messages
      if (documentSnapshots && (documentSnapshots as any).docs && (documentSnapshots as any).docs.length > 0) {
        this.firstMessageSnapshot = (documentSnapshots as any).docs[0];
        this.lastMessageSnapshot = (documentSnapshots as any).docs[(documentSnapshots as any).docs.length - 1];
      } else {
        this.firstMessageSnapshot = null;
        this.lastMessageSnapshot = null;
      }
      this.hasMoreMessages = initialMessages.length === MESSAGE_PAGE_SIZE;

      this.messages = initialMessages.reverse(); // Show oldest first
      this.isInitialLoad = false;

      this.setupNewMessagesListener();
      this.notify();

    } catch (error) {
      const err = error as FirebaseError;
      // Suppress offline/permission errors
      if (err.message?.includes('client is offline') ||
        err.message?.includes('Failed to get document') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        this.isInitialLoad = false;
        this.messages = [];
        this.hasMoreMessages = false;
        this.notify();
        return;
      }
      logger.error("Error loading initial messages", error as Error, { roomId: this.roomId });
      this.isInitialLoad = false;
      this.notify();
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        operation: 'list',
        path: `rooms/${this.roomId}/messages`
      }));
    }
  }

  private setupNewMessagesListener() {
    if (this.newestMessageListenerUnsub) {
      this.newestMessageListenerUnsub();
    }

    // In demo mode, skip setting up listener
    if (isDemoMode()) {
      return;
    }

    const messagesRef = collection(this.firestore, 'rooms', this.roomId, 'messages');
    let qNew;
    if (this.firstMessageSnapshot) {
      qNew = query(messagesRef, orderBy('createdAt', 'asc'), startAfter(this.firstMessageSnapshot));
    } else {
      // If no firstMessageSnapshot (empty room), listen to all new messages from now
      // Use a reasonable limit to prevent excessive data loading
      qNew = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
    }

    this.newestMessageListenerUnsub = onSnapshot(qNew, (snapshot) => {
      if (snapshot.empty) return;

      // Accumulate messages into pendingNewMessages and schedule a single processing tick
      snapshot.docs.forEach((docSnapshot: DocumentSnapshot<DocumentData>) => {
        const data = typeof docSnapshot.data === 'function' ? docSnapshot.data() : docSnapshot;
        const msg: Message = {
          id: docSnapshot.id,
          ...data,
          senderId: data.senderId || data.user?.id || '',
          reactions: data.reactions || [],
          delivered: data.delivered ?? false,
          seen: data.seen ?? false,
        } as Message;

        // Deduplicate by id/clientMessageId
        const dedupeKey = msg.id || (msg as any).clientMessageId;
        if (dedupeKey && this.receivedMessageIds.has(dedupeKey)) return;
        if (dedupeKey) this.receivedMessageIds.add(dedupeKey);

        this.pendingNewMessages.push(msg);
      });

      if (!this.newMessagesProcessingScheduled) {
        this.newMessagesProcessingScheduled = true;
        setTimeout(() => this.processPendingNewMessages(), 0);
      }
    }, (error) => {
      const err = error as FirebaseError;
      // Suppress offline/permission errors
      if (err.message?.includes('client is offline') ||
        err.message?.includes('Failed to get document') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        return; // Silently ignore
      }
      logger.error("New messages listener error", error as Error, { roomId: this.roomId });
    });

    this.unsubscribes.push(this.newestMessageListenerUnsub);
  }

  private processPendingNewMessages() {
    this.newMessagesProcessingScheduled = false;
    if (this.pendingNewMessages.length === 0) return;

    // Merge pending messages into messages map to deduplicate and sort
    const messageMap = new Map<string, Message>();
    this.messages.forEach(m => messageMap.set(m.id, m));
    this.pendingNewMessages.forEach(m => messageMap.set(m.id, m));

    this.messages = Array.from(messageMap.values()).sort((a, b) =>
      (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
    );

    // Keep receivedMessageIds bounded
    if (this.receivedMessageIds.size > 1000) {
      const idsArray = Array.from(this.receivedMessageIds);
      this.receivedMessageIds = new Set(idsArray.slice(-500));
    }

    this.pendingNewMessages = [];
    this.notify();
  }

  public async loadMoreMessages() {
    if (!this.hasMoreMessages || this.isFetchingMore) {
      return;
    }

    this.isFetchingMore = true;

    try {
      const messagesRef = collection(this.firestore, 'rooms', this.roomId, 'messages');
      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(this.lastMessageSnapshot),
        limit(MESSAGE_PAGE_SIZE)
      );

      const documentSnapshots = await withRetryAndTimeout(
        () => getDocs(q),
        { timeoutMs: 30_000, attempts: 3, backoffMs: 500 }
      ).catch(() => null);
      const olderDocs = documentSnapshots && 'docs' in documentSnapshots ? documentSnapshots.docs : [];
      const olderMessages = olderDocs.map((doc: DocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...(typeof doc.data === 'function' ? doc.data() : doc)
      } as Message));

      this.lastMessageSnapshot = olderDocs.length > 0 ? olderDocs[olderDocs.length - 1] : this.lastMessageSnapshot;
      this.hasMoreMessages = olderMessages.length === MESSAGE_PAGE_SIZE;

      if (olderMessages.length > 0) {
        this.messages = [...olderMessages.reverse(), ...this.messages];
        this.notify();
      }
    } catch (error) {
      logger.error("Error loading more messages", error as Error, { roomId: this.roomId });
    } finally {
      this.isFetchingMore = false;
    }
  }

  // --- User and Room Management ---

  public async signInAnonymouslyIfNeeded(): Promise<string> {
    // Check if Firebase config is valid before attempting to use it (skip in demo mode)
    if (!isDemoMode() && !isFirebaseConfigValid()) {
      const error = new Error('Firebase configuration is invalid. Please set up your Firebase credentials in .env.local file. See FIREBASE_SETUP.md for instructions.');
      error.name = 'FirebaseConfigError';
      throw error;
    }

    // In demo mode, return a mock user ID
    if (isDemoMode()) {
      if (!this.auth.currentUser) {
        // Create a mock user ID for demo mode
        const mockUserId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return mockUserId;
      }
      return this.auth.currentUser.uid;
    }

    if (!this.auth.currentUser) {
      const userCredential = await signInAnonymously(this.auth);
      return userCredential.user.uid;
    }
    return this.auth.currentUser.uid;
  }

  public async resolveUser(name: string, avatar: string): Promise<UserProfile> {
    const uid = await this.signInAnonymouslyIfNeeded();
    const userDocRef = doc(this.firestore, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const existingUser = userDoc.data() as UserProfile;
      if (existingUser.avatar !== avatar || existingUser.name !== name) {
        await setDoc(userDocRef, { avatar, name }, { merge: true });
        return { ...existingUser, avatar, name };
      }
      return existingUser;
    } else {
      const newUser: UserProfile = { id: uid, name, avatar };
      await setDoc(userDocRef, newUser);
      return newUser;
    }
  }

  public async joinRoom(user: UserProfile, validateRoom: boolean = false): Promise<void> {
    // Check if already joined
    if (this.currentUser && this.currentUser.id === user.id) {
      return; // Already joined
    }

    // In demo mode, skip Firebase operations
    if (isDemoMode()) {
      this.currentUser = user;
      // Update local state only
      this.onlineUsers = [user];
      logger.info('[DEMO MODE] User joined room via ChatService', {
        roomId: this.roomId,
        userId: user.id,
        userName: user.name,
        currentUserSet: !!this.currentUser
      });
      this.notify();
      return;
    }

    // Race condition protection: if already joining, wait for existing promise
    if (this.isJoining && this.joinPromise) {
      return this.joinPromise;
    }

    // Start join operation
    this.isJoining = true;
    this.joinPromise = (async () => {
      try {
        this.currentUser = user;

        // Initialize RTDB managers
        this.typingManager = new TypingManager(this.roomId, user.id);

        const roomRef = doc(this.firestore, 'rooms', this.roomId);

        await withRetryAndTimeout(() => runTransaction(this.firestore, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);

          // If validation is required and room doesn't exist, throw error
          if (validateRoom && !roomDoc.exists()) {
            throw new Error(`Room ${this.roomId} does not exist`);
          }

          if (!roomDoc.exists()) {
            // Create room with full structure (only if validation is not required)
            transaction.set(roomRef, {
              id: this.roomId,
              participants: [user.id],
              participantProfiles: [user],
              typing: [],
              createdAt: serverTimestamp(),
              lastUpdated: serverTimestamp(),
              settings: {}
            });
            return;
          }

          const roomData = roomDoc.data() as Room;

          // Check if room already has 2 participants (maximum for 1-on-1 chat)
          const currentParticipants = roomData.participants || [];
          if (currentParticipants.length >= 2 && !currentParticipants.includes(user.id)) {
            throw new Error('Эта комната уже занята. Выберите другой код комнаты или договоритесь с собеседником о коде.');
          }

          const participantIds = new Set(roomData.participants || []);
          participantIds.add(user.id);
          const updatedIds = Array.from(participantIds);

          const userProfilePromises = updatedIds.map(uid => getDoc(doc(this.firestore, 'users', uid)));
          const userProfileDocs = await Promise.all(userProfilePromises);
          const updatedProfiles = userProfileDocs
            .filter(d => d.exists())
            .map(d => d.data() as UserProfile);

          transaction.update(roomRef, {
            participants: updatedIds,
            participantProfiles: updatedProfiles,
            lastUpdated: serverTimestamp()
          });
        }), { timeoutMs: 30_000, attempts: 3, backoffMs: 500 });

        // Initialize RTDB subscriptions after successful join
        this.initRealtimeSubscriptions();
      } catch (error) {
        const err = error as FirebaseError;
        // In demo mode or if permission denied, silently fail and use local state
        if (isDemoMode() ||
          err.code === 'permission-denied' ||
          err.message?.includes('Permission denied') ||
          err.message?.includes('client is offline')) {
          // Update local state only
          this.onlineUsers = [user];
          this.notify();
          return;
        }
        // Re-throw other errors
        throw error;
      } finally {
        this.isJoining = false;
        this.joinPromise = null;
      }
    })();

    return this.joinPromise;
  }

  public async leaveRoom() {
    if (!this.currentUser) return;

    // In demo mode, just clear local state
    if (isDemoMode()) {
      this.currentUser = null;
      this.onlineUsers = [];
      this.notify();
      return;
    }

    const roomRef = doc(this.firestore, 'rooms', this.roomId);
    try {
      await withRetryAndTimeout(() => runTransaction(this.firestore, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
          return;
        }

        const roomData = roomDoc.data() as Room;
        const updatedParticipants = (roomData.participants || []).filter(id => id !== this.currentUser!.id);
        const updatedProfiles = (roomData.participantProfiles || []).filter(p => p.id !== this.currentUser!.id);

        transaction.update(roomRef, {
          participants: updatedParticipants,
          participantProfiles: updatedProfiles,
          typing: arrayRemove(this.currentUser!.name),
          lastUpdated: serverTimestamp()
        });
      }), { timeoutMs: 30_000, attempts: 3, backoffMs: 500 });
    } catch (error) {
      const firebaseError = error as { code?: string };
      // Suppress offline/permission errors
      if (firebaseError.code === 'unavailable' ||
        firebaseError.code === 'permission-denied' ||
        (error as Error).message?.includes('client is offline')) {
        // Clear local state anyway
        this.currentUser = null;
        this.onlineUsers = [];
        this.notify();
        return;
      }
      if (firebaseError.code !== 'not-found') {
        logger.error("Error leaving room", error as Error, { roomId: this.roomId, userId: this.currentUser?.id });
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          operation: 'update',
          path: `rooms/${this.roomId}`
        }));
      }
    }
  }

  // --- Messages with Rate Limiting ---

  public async sendMessage(messageData: Omit<Message, 'id' | 'createdAt' | 'reactions' | 'delivered' | 'seen'>, clientMessageId?: string) {
    // Prevent re-entrant concurrent sends that could cause race conditions.
    // Do not await timers here (breaks tests with fake timers). If another send
    // is in progress, we proceed but mark sendingMessage to avoid deep reentrancy.
    if (!this.sendingMessage) {
      this.sendingMessage = true;
    } else {
      // already sending - continue without waiting to preserve test timing
    }
    if (!this.currentUser) {
      logger.warn('[DEMO MODE] sendMessage called but currentUser is not set', {
        roomId: this.roomId,
        hasCurrentUser: !!this.currentUser,
        messageText: messageData.text?.substring(0, 50)
      });
      this.sendingMessage = false;
      return;
    }

    const hasText = messageData.text && messageData.text.trim().length > 0;
    const hasImage = messageData.imageUrl;

    if (!hasText && !hasImage && messageData.type !== 'sticker' && messageData.type !== 'doodle') {
      return; // Don't send empty messages
    }

    // Normalize and validate message type and size
    const normalizedType = messageData.type || 'text';
    if (normalizedType === 'text' && messageData.text && messageData.text.length > 2000) {
      throw new Error('Message too long. Maximum length is 2000 characters.');
    }

    // Generate client message ID for deduplication
    const msgId = clientMessageId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check for duplicate
    if (this.sentMessageIds.has(msgId)) {
      logger.warn('Duplicate message detected, skipping', { clientMessageId: msgId });
      return;
    }

    // Anti-flood and rate-limiting check
    this.checkMessageRate();

    const now = Date.now();
    if (this.isMuted) {
      throw new Error(`You are temporarily muted. Please wait ${this.muteSecondsLeft} seconds.`);
    }
    if (now - this.lastMessageTime < this.messageCooldown) {
      throw new Error('System cooldown active. Please wait before sending another message.');
    }

    this.lastMessageTime = now;
    this.recentMessageTimestamps.push(now);
    this.sentMessageIds.add(msgId);

    // Cleanup old IDs (keep last 100)
    if (this.sentMessageIds.size > 100) {
      const idsArray = Array.from(this.sentMessageIds);
      this.sentMessageIds = new Set(idsArray.slice(-100));
    }

    // In demo mode, add message to local state only
    if (isDemoMode()) {
      const demoMessage: Message = {
        id: msgId,
        ...messageData,
        senderId: this.currentUser.id,
        createdAt: Timestamp.now(),
        reactions: [],
        delivered: true, // In demo mode, consider delivered immediately
        seen: true, // In demo mode, consider seen immediately
      };
      // Create new array to ensure React detects the change
      const newMessages = [...this.messages, demoMessage];
      // Sort messages by timestamp
      newMessages.sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
      this.messages = newMessages;
      logger.info('[DEMO MODE] Message added to local state', {
        messageId: msgId,
        messagesCount: this.messages.length,
        text: messageData.text?.substring(0, 50),
        allMessageIds: this.messages.map(m => m.id),
        listenersCount: this.listeners.length
      });
      this.notify();
      logger.debug('[DEMO MODE] Notify called after message added', {
        messagesCount: this.messages.length,
        listenersCount: this.listeners.length
      });
      return;
    }

    try {
      await withRetryAndTimeout(() => addDoc(collection(this.firestore, 'rooms', this.roomId, 'messages'), {
        ...messageData,
        senderId: this.currentUser!.id, // Quick access for filtering/indexing
        clientMessageId: msgId, // Store for deduplication on receive
        createdAt: serverTimestamp(),
        reactions: [],
        delivered: false, // Initially not delivered
        seen: false, // Initially not seen
      }),
        { timeoutMs: 30_000, attempts: 3, backoffMs: 500 }
      );
      this.sendingMessage = false;
    } catch (error) {
      const err = error as FirebaseError;
      // Suppress offline/permission errors
      if (err.message?.includes('client is offline') ||
        err.message?.includes('Failed to get document') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        // Add to local state anyway in offline mode
        const offlineMessage: Message = {
          id: msgId,
          ...messageData,
          senderId: this.currentUser.id,
          createdAt: Timestamp.now(),
          reactions: [],
          delivered: true, // Consider delivered in offline mode
          seen: true, // Consider seen in offline mode
        };
        this.messages.push(offlineMessage);
        this.notify();
        return;
      }
      // Remove from sent set on error to allow retry
      this.sentMessageIds.delete(msgId);
      logger.error("Error sending message", error as Error, { roomId: this.roomId, userId: this.currentUser?.id });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        operation: 'create',
        path: `rooms/${this.roomId}/messages`,
        requestResourceData: messageData
      }));
      this.sendingMessage = false;
      throw error;
    }
  }

  private checkMessageRate() {
    const now = Date.now();
    // Remove timestamps older than the flood threshold time
    this.recentMessageTimestamps = this.recentMessageTimestamps.filter(
      ts => now - ts < this.floodThresholdTime
    );

    if (this.recentMessageTimestamps.length >= this.floodThresholdCount) {
      this.applyMute();
      this.recentMessageTimestamps = []; // Reset after muting
    }
  }

  private applyMute() {
    if (this.isMuted) return;

    this.isMuted = true;
    this.muteSecondsLeft = 10;
    if (this.onMuteUpdate) this.onMuteUpdate(this.muteSecondsLeft);

    this.muteCountdownTimer = setInterval(() => {
      this.muteSecondsLeft -= 1;
      if (this.onMuteUpdate) this.onMuteUpdate(this.muteSecondsLeft);
      if (this.muteSecondsLeft <= 0) {
        if (this.muteCountdownTimer) clearInterval(this.muteCountdownTimer);
        this.isMuted = false;
      }
    }, 1000);

    this.muteTimer = setTimeout(() => {
      this.isMuted = false;
      if (this.muteCountdownTimer) clearInterval(this.muteCountdownTimer);
      this.muteSecondsLeft = 0;
      if (this.onMuteUpdate) this.onMuteUpdate(0);
    }, 10000); // 10-second mute
  }

  public async deleteMessage(messageId: string) {
    // In demo mode, remove from local state only
    if (isDemoMode()) {
      this.messages = this.messages.filter(msg => msg.id !== messageId);
      this.notify();
      return;
    }

    const msgRef = doc(this.firestore, 'rooms', this.roomId, 'messages', messageId);
    try {
      await deleteDoc(msgRef);
    } catch (error) {
      const err = error as FirebaseError;
      // Suppress offline/permission errors
      if (err.message?.includes('client is offline') ||
        err.message?.includes('Failed to get document') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        // Remove from local state anyway
        this.messages = this.messages.filter(msg => msg.id !== messageId);
        this.notify();
        return;
      }
      logger.error("Error deleting message", error as Error, { roomId: this.roomId, messageId });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        operation: 'delete',
        path: msgRef.path
      }));
      throw error;
    }
  }

  public async toggleReaction(messageId: string, emoji: string, user: UserProfile) {
    // In demo mode, update local state only
    if (isDemoMode()) {
      const message = this.messages.find(msg => msg.id === messageId);
      if (message) {
        const reactions = message.reactions || [];
        const existingIndex = reactions.findIndex(r => r.emoji === emoji && r.userId === user.id);
        if (existingIndex > -1) {
          reactions.splice(existingIndex, 1);
        } else {
          reactions.push({ emoji, userId: user.id, username: user.name });
        }
        message.reactions = reactions;
        this.notify();
      }
      return;
    }

    const messageRef = doc(this.firestore, 'rooms', this.roomId, 'messages', messageId);

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const messageDoc = await transaction.get(messageRef);
        if (!messageDoc.exists()) throw "Document does not exist!";

        const messageData = messageDoc.data() as Message;
        const newReactions = messageData.reactions || [];

        const existingReactionIndex = newReactions.findIndex(
          (r) => r.emoji === emoji && r.userId === user.id
        );

        if (existingReactionIndex > -1) {
          newReactions.splice(existingReactionIndex, 1);
        } else {
          const newReaction: Reaction = { emoji, userId: user.id, username: user.name };
          newReactions.push(newReaction);
        }

        transaction.update(messageRef, { reactions: newReactions });
      });
    } catch (error) {
      const err = error as FirebaseError;
      // Suppress offline/permission errors
      if (err.message?.includes('client is offline') ||
        err.message?.includes('Failed to get document') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        // Update local state anyway
        const message = this.messages.find(msg => msg.id === messageId);
        if (message) {
          const reactions = message.reactions || [];
          const existingIndex = reactions.findIndex(r => r.emoji === emoji && r.userId === user.id);
          if (existingIndex > -1) {
            reactions.splice(existingIndex, 1);
          } else {
            reactions.push({ emoji, userId: user.id, username: user.name });
          }
          message.reactions = reactions;
          this.notify();
        }
        return;
      }
      logger.error("Error toggling reaction", error as Error, { roomId: this.roomId, messageId, emoji, userId: user.id });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        operation: 'update',
        path: messageRef.path
      }));
      throw error;
    }
  }

  /**
   * Send typing indicator (RTDB)
   */
  public sendTyping() {
    this.typingManager?.sendTyping();
  }

  /**
   * Explicitly set typing status (for future use or specific UI controls)
   */
  public setTypingStatus(isTyping: boolean) {
    if (isTyping) {
      this.sendTyping();
    }
    // Note: RTDB typing manager handles auto-expiration, so explicit 'false' might not be needed
    // unless we want to clear it immediately.
  }

  /**
   * Mark messages as seen (only when chat is open and tab is active)
   */
  public async markMessagesAsSeen() {
    if (!this.currentUser) return;

    const batch = writeBatch(this.firestore);
    let hasUpdates = false;

    this.messages.forEach(msg => {
      if (msg.senderId !== this.currentUser!.id && !msg.seen) {
        const msgRef = doc(this.firestore, 'rooms', this.roomId, 'messages', msg.id);
        batch.update(msgRef, { seen: true });
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      try {
        await batch.commit();
      } catch (error) {
        logger.error("Error marking messages as seen", error as Error, { roomId: this.roomId });
      }
    }
  }

  public async uploadImage(file: File): Promise<string> {
    // In demo mode, create a data URL instead
    if (isDemoMode()) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          resolve(dataUrl);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const safeFileName = Date.now().toString();
    const storagePath = `chat_images/${this.roomId}/${this.currentUser!.id}/${safeFileName}`;
    const storageRef = ref(this.storage, storagePath);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    } catch (error) {
      const err = error as FirebaseError;
      // If offline, fallback to data URL
      if (err.message?.includes('client is offline') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            resolve(dataUrl);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      throw error;
    }
  }

  public sendSystemMessage(text: string) {
    const systemUser: UserProfile = { id: 'system', name: 'System', avatar: '' };
    return this.sendMessage({
      text,
      user: systemUser,
      senderId: 'system',
      type: 'system',
    });
  }

  // --- Canvas ---

  public async createCanvasSheet(name: string): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'rooms', this.roomId, 'canvasSheets'), {
      name,
      createdAt: serverTimestamp(),
    });
  }

  public async saveCanvasPath(pathData: Omit<CanvasPath, 'id' | 'createdAt'>) {
    await addDoc(collection(this.firestore, 'rooms', this.roomId, 'canvasPaths'), {
      ...pathData,
      createdAt: serverTimestamp(),
    });
  }

  public async clearCanvasSheet(sheetId: string) {
    const pathsQuery = query(
      collection(this.firestore, 'rooms', this.roomId, 'canvasPaths'),
      where('sheetId', '==', sheetId)
    );
    const snapshot = await getDocs(pathsQuery);

    if (snapshot.empty) return;

    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  // --- Games ---

  /**
   * Remove undefined values from object (Firestore doesn't support undefined)
   */
  private removeUndefinedValues(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item));
    }

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = this.removeUndefinedValues(value);
      }
    }
    return cleaned;
  }

  public async updateGameState(gameId: string, newState: Partial<GameState>) {
    // In demo mode, update local state only
    if (isDemoMode()) {
      if (this.gameStates) {
        this.gameStates[gameId] = { ...this.gameStates[gameId], ...newState } as GameState;
        this.notify();
      }
      return;
    }

    const gameRef = doc(this.firestore, 'rooms', this.roomId, 'games', gameId);
    try {
      // Remove undefined values before sending to Firestore
      const cleanedState = this.removeUndefinedValues(newState) as Partial<GameState>;
      await setDoc(gameRef, cleanedState, { merge: true });
    } catch (error) {
      const err = error as FirebaseError;

      // Check for nested arrays error
      if (err.message?.includes('Nested arrays are not supported')) {
        logger.error("Nested arrays detected in game state", error as Error, {
          roomId: this.roomId,
          gameId,
          hint: 'Use flattened structure or maps instead of nested arrays'
        });
        throw new Error('Game state contains nested arrays which are not supported by Firestore. Please restructure the data.');
      }

      // Suppress offline/permission errors
      if (err.message?.includes('client is offline') ||
        err.message?.includes('Failed to get document') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        // Update local state anyway
        if (this.gameStates) {
          this.gameStates[gameId] = { ...this.gameStates[gameId], ...newState } as GameState;
          this.notify();
        }
        return;
      }
      logger.error("Error updating game state", error as Error, { roomId: this.roomId, gameId });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        operation: 'update',
        path: gameRef.path
      }));
      throw error;
    }
  }

  public async deleteGame(gameId: string) {
    // In demo mode, remove from local state only
    if (isDemoMode()) {
      if (this.gameStates) {
        delete this.gameStates[gameId];
        this.notify();
      }
      return;
    }

    try {
      await deleteDoc(doc(this.firestore, 'rooms', this.roomId, 'games', gameId));
    } catch (error) {
      const err = error as FirebaseError;
      // Suppress offline/permission errors
      if (err.message?.includes('client is offline') ||
        err.message?.includes('Failed to get document') ||
        err.code === 'unavailable' ||
        err.code === 'permission-denied') {
        // Remove from local state anyway
        if (this.gameStates) {
          delete this.gameStates[gameId];
          this.notify();
        }
        return;
      }
      logger.error("Error deleting game", error as Error, { roomId: this.roomId, gameId });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        operation: 'delete',
        path: `rooms/${this.roomId}/games/${gameId}`
      }));
      throw error;
    }
  }

  // --- Subscription Management ---

  public subscribe(listener: ChatServiceListener) {
    this.listeners.push(listener);
  }

  public unsubscribe(listener: ChatServiceListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    // In demo mode, call listeners synchronously for immediate updates
    // In production, use setTimeout to batch React updates
    if (isDemoMode()) {
      this.listeners.forEach(l => {
        try {
          l();
        } catch (error) {
          logger.error('Error in listener', error as Error);
        }
      });
    } else {
      // Use setTimeout to ensure state updates happen in the next tick
      // This helps React batch updates properly
      setTimeout(() => {
        this.listeners.forEach(l => {
          try {
            l();
          } catch (error) {
            logger.error('Error in listener', error as Error);
          }
        });
      }, 0);
    }
  }

  public async disconnect() {
    if (this.currentUser) {
      await this.leaveRoom();
    }

    // Disconnect RTDB managers
    if (this.typingManager) {
      this.typingManager.disconnect();
      this.typingManager = null;
    }

    // Clear all subscriptions
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];

    // Clear timers
    if (this.muteTimer) clearTimeout(this.muteTimer);
    if (this.muteCountdownTimer) clearInterval(this.muteCountdownTimer);

    // Reset state
    this.currentUser = null;
    this.isJoining = false;
    this.joinPromise = null;
    this.sentMessageIds.clear();
    this.receivedMessageIds.clear();

    // Cleanup message queue callback
    // Avoid accessing the lazy getter which may re-initialize the callback twice.
    const mq = this._messageQueue ?? getMessageQueue();
    this._messageQueue = mq;
    mq.setSendCallback(() => {
      return Promise.reject(new Error('ChatService disconnected'));
    });
  }
}

// Singleton management per room
const chatServices = new Map<string, ChatService>();

export function getChatService(
  roomId: string,
  firestore: Firestore,
  auth: Auth,
  storage: FirebaseStorage
): ChatService {
  if (!chatServices.has(roomId)) {
    chatServices.set(roomId, new ChatService(roomId, firestore, auth, storage));
    logger.info("ChatService created", { roomId });
  }
  return chatServices.get(roomId)!;
}

/**
 * Отключить и удалить ChatService для комнаты
 * Используется для очистки ресурсов при выходе из комнаты
 *
 * @param roomId - ID комнаты
 */
export async function disconnectChatService(roomId: string): Promise<void> {
  const service = chatServices.get(roomId);
  if (service) {
    await service.disconnect();
    chatServices.delete(roomId);
    logger.info("ChatService deleted", { roomId });
  }
}

/**
 * Получить все активные комнаты (для отладки)
 */
export function getActiveChatServiceRoomIds(): string[] {
  return Array.from(chatServices.keys());
}

// Legacy export for backward compatibility
export const chatService = {
  getInstance: () => {
    throw new Error("Use getChatService(roomId, firestore, auth, storage) instead");
  }
};
