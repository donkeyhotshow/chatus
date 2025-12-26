'use client';

import {
  collection, query, addDoc,
  serverTimestamp, where, Unsubscribe, doc, Firestore, writeBatch, getDocs, setDoc, getDoc, updateDoc
} from "firebase/firestore";
import { Auth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import "@/lib/error-emitter";
import "@/lib/errors";
import { isDemoMode } from "@/lib/demo-mode";
import { logger } from "@/lib/logger";
import { Message, CanvasPath, UserProfile, GameState, Room } from "@/lib/types";
import { getMessageQueue } from "./MessageQueue";
import { MessageService } from "./MessageService";
import { PresenceService } from "./PresenceService";
import { GameService } from "./GameService";

type ChatServiceListener = () => void;

// Retry helper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 500
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

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

  // Sub-services
  private messageService: MessageService;
  private presenceService: PresenceService;
  private gameService: GameService;

  // Listeners
  private listeners: ChatServiceListener[] = [];
  private unsubscribes: Unsubscribe[] = [];

  // Race condition protection - P0-001 fix
  private isJoining: boolean = false;
  private joinPromise: Promise<void> | null = null;
  private hasJoined: boolean = false;
  private lastJoinAttempt: number = 0;
  private readonly JOIN_DEBOUNCE_MS = 2000; // Debounce join attempts

  private _messageQueue: ReturnType<typeof getMessageQueue> | null = null;

  constructor(roomId: string, firestore: Firestore, auth: Auth, storage: FirebaseStorage) {
    this.roomId = roomId;
    this.firestore = firestore;
    this.auth = auth;
    this.storage = storage;

    // Initialize sub-services
    const notify = () => this.syncAndNotify();
    this.messageService = new MessageService(roomId, firestore, notify);
    this.presenceService = new PresenceService(roomId, firestore, notify);
    this.gameService = new GameService(roomId, firestore, notify);
  }

  public async signInAnonymouslyIfNeeded(): Promise<string> {
    if (this.auth.currentUser) return this.auth.currentUser.uid;

    const { signInAnonymously } = await import('firebase/auth');
    const userCredential = await signInAnonymously(this.auth);
    return userCredential.user.uid;
  }

  private syncAndNotify() {
    // Batch state updates to prevent multiple re-renders
    const newMessages = this.messageService.messages;
    const newOnlineUsers = this.presenceService.onlineUsers;
    const newTypingUsers = this.presenceService.typingUsers;
    const newGameStates = this.gameService.gameStates;
    const newIsInitialLoad = this.messageService.isInitialLoad;
    const newHasMoreMessages = this.messageService.hasMoreMessages;

    // Only update and notify if something actually changed
    const hasChanges =
      this.messages !== newMessages ||
      this.onlineUsers !== newOnlineUsers ||
      this.typingUsers !== newTypingUsers ||
      this.gameStates !== newGameStates ||
      this.isInitialLoad !== newIsInitialLoad ||
      this.hasMoreMessages !== newHasMoreMessages;

    if (hasChanges) {
      this.messages = newMessages;
      this.onlineUsers = newOnlineUsers;
      this.typingUsers = newTypingUsers;
      this.gameStates = newGameStates;
      this.isInitialLoad = newIsInitialLoad;
      this.hasMoreMessages = newHasMoreMessages;

      // Debounce notifications to prevent excessive updates
      this.debouncedNotify();
    }
  }

  private notifyTimeout: NodeJS.Timeout | null = null;
  private debouncedNotify() {
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
    }
    this.notifyTimeout = setTimeout(() => {
      this.notify();
      this.notifyTimeout = null;
    }, 16); // ~60fps
  }

  private initListeners() {
    this.messageService.loadInitialMessages();
    this.presenceService.initListeners();
    this.gameService.initListeners();
  }

  private get messageQueue() {
    if (!this._messageQueue) {
      try {
        this._messageQueue = getMessageQueue();
        this._messageQueue.setSendCallback(async (messageData, clientMessageId) => {
          return await this.messageService.sendMessage(messageData, clientMessageId);
        });
      } catch (error) {
        logger.error('Failed to initialize message queue', error as Error);
        return {
          enqueue: () => { },
          setSendCallback: () => { }
        } as any;
      }
    }
    return this._messageQueue;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async joinRoom(user: UserProfile, _isNewRoom: boolean = false): Promise<void> {
    const now = Date.now();

    // P0-001 FIX: Debounce join attempts to prevent transaction conflicts
    if (now - this.lastJoinAttempt < this.JOIN_DEBOUNCE_MS) {
      logger.debug('[ChatService] Join debounced', { roomId: this.roomId, timeSinceLastAttempt: now - this.lastJoinAttempt });
      if (this.joinPromise) return this.joinPromise;
      return Promise.resolve();
    }

    // Prevent multiple simultaneous joins
    if (this.isJoining) return this.joinPromise || Promise.resolve();

    // Prevent re-joining if already joined with same user
    if (this.hasJoined && this.currentUser?.id === user.id) {
      return Promise.resolve();
    }

    this.isJoining = true;
    this.lastJoinAttempt = now;

    this.joinPromise = (async () => {
      try {
        this.currentUser = user;
        this.messageService.setCurrentUser(user);
        this.presenceService.setCurrentUser(user);

        if (isDemoMode()) {
          this.hasJoined = true;
          this.initListeners();
          return;
        }

        // P0-001 FIX: Use setDoc with merge to avoid transaction conflicts
        await withRetry(async () => {
          const roomRef = doc(this.firestore, 'rooms', this.roomId);
          const roomDoc = await getDoc(roomRef);

          if (!roomDoc.exists()) {
            // Create new room with setDoc (no transaction needed)
            await setDoc(roomRef, {
              id: this.roomId,
              participants: [user.id],
              participantProfiles: [user],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            // P0-001 FIX: Use setDoc with merge instead of updateDoc to avoid conflicts
            const data = roomDoc.data() as Room;
            const participants = data.participants || [];
            const profiles = data.participantProfiles || [];

            if (!participants.includes(user.id)) {
              // Use merge to safely add user without overwriting other fields
              await setDoc(roomRef, {
                participants: [...participants, user.id],
                participantProfiles: [...profiles.filter(p => p.id !== user.id), user],
                updatedAt: serverTimestamp(),
              }, { merge: true });
            } else {
              // User already in room, just update their profile
              const updatedProfiles = profiles.map(p => p.id === user.id ? user : p);
              if (!profiles.some(p => p.id === user.id)) {
                updatedProfiles.push(user);
              }
              await setDoc(roomRef, {
                participantProfiles: updatedProfiles,
                updatedAt: serverTimestamp(),
              }, { merge: true });
            }
          }
        }, 3, 500); // Increased backoff for stability
        
        this.hasJoined = true;
        this.initListeners();
      } catch (error) {
        logger.error("Error joining room", error as Error, { roomId: this.roomId });
        throw error;
      } finally {
        this.isJoining = false;
        this.joinPromise = null;
      }
    })();

    return this.joinPromise;
  }

  public async leaveRoom(): Promise<void> {
    if (!this.currentUser || isDemoMode()) return;

    try {
      await withRetry(async () => {
        const roomRef = doc(this.firestore, 'rooms', this.roomId);
        const roomDoc = await getDoc(roomRef);

        if (!roomDoc.exists()) return;

        const data = roomDoc.data() as Room;
        const participants = (data.participants || []).filter(id => id !== this.currentUser?.id);
        const profiles = (data.participantProfiles || []).filter(p => p.id !== this.currentUser?.id);

        await updateDoc(roomRef, {
          participants,
          participantProfiles: profiles,
          updatedAt: serverTimestamp(),
        });
      }, 2, 200);

      this.hasJoined = false;
    } catch (error) {
      // Don't crash on leave room errors - user is leaving anyway
      logger.warn("Error leaving room (non-critical)", error as Error, { roomId: this.roomId });
    }
  }

  public loadMoreMessages = async () => {
    return this.messageService.loadMoreMessages();
  };

  public sendMessage = async (messageData: any, clientMessageId?: string) => {
    return this.messageService.sendMessage(messageData, clientMessageId);
  };

  public deleteMessage = async (messageId: string) => {
    return this.messageService.deleteMessage(messageId);
  };

  public toggleReaction = async (messageId: string, emoji: string, user: UserProfile) => {
    return this.messageService.toggleReaction(messageId, emoji, user);
  };

  public sendTyping() {
    this.presenceService.sendTyping();
  }

  public stopTyping() {
    this.presenceService.stopTyping();
  }

  public setTypingStatus(isTyping: boolean) {
    if (isTyping) {
      this.sendTyping();
    } else {
      this.stopTyping();
    }
  }

  public async markMessagesAsSeen() {
    return this.messageService.markMessagesAsSeen();
  }

  public async markMessagesAsDelivered() {
    return this.messageService.markMessagesAsDelivered();
  }

  public async uploadImage(file: File): Promise<string> {
    if (isDemoMode()) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    const storagePath = `chat_images/${this.roomId}/${this.currentUser?.id || 'anon'}/${Date.now()}`;
    const storageRef = ref(this.storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
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

  public async createCanvasSheet(name: string): Promise<{ id: string; name: string; }> {
    const docRef = await addDoc(collection(this.firestore, 'rooms', this.roomId, 'canvasSheets'), {
      name,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, name };
  }

  public async saveCanvasPath(pathData: Omit<CanvasPath, 'id' | 'createdAt'>) {
    await addDoc(collection(this.firestore, 'rooms', this.roomId, 'canvasPaths'), {
      ...pathData,
      createdAt: serverTimestamp(),
    });
  }

  public async saveCanvasStrokes(sheetId: string, strokes: Omit<CanvasPath, 'id' | 'createdAt'>[]) {
    const batch = writeBatch(this.firestore);
    const pathsCollection = collection(this.firestore, 'rooms', this.roomId, 'canvasPaths');
    
    strokes.forEach(stroke => {
      const docRef = doc(pathsCollection);
      batch.set(docRef, {
        ...stroke,
        sheetId, // Ensure sheetId is set
        createdAt: serverTimestamp(),
      });
    });
    
    await batch.commit();
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

  public async updateGameState(gameId: string, newState: Partial<GameState>) {
    return this.gameService.updateGameState(gameId, newState);
  }

  public async deleteGame(gameId: string) {
    return this.gameService.deleteGame(gameId);
  }

  public subscribe(listener: ChatServiceListener) {
    this.listeners.push(listener);
  }

  public unsubscribe(listener: ChatServiceListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    setTimeout(() => {
      this.listeners.forEach(l => {
        try { l(); } catch (e) { logger.error('Listener error', e as Error); }
      });
    }, 0);
  }

  public async disconnect() {
    try {
      if (this.currentUser && this.hasJoined) await this.leaveRoom();
    } catch (error) {
      // Ignore errors during disconnect - user is leaving anyway
      logger.warn('Error during disconnect leaveRoom', error as Error);
    }

    this.messageService.disconnect();
    this.presenceService.disconnect();
    this.gameService.disconnect();

    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];

    this.currentUser = null;
    this.isJoining = false;
    this.joinPromise = null;
    this.hasJoined = false;

    try {
      const mq = this._messageQueue ?? getMessageQueue();
      mq.setSendCallback(() => Promise.reject(new Error('Disconnected')));
    } catch {
      // Ignore message queue errors during disconnect
    }
  }
}

const chatServices = new Map<string, ChatService>();

export function getChatService(roomId: string, firestore: Firestore, auth: any, storage: any): ChatService {
  if (!chatServices.has(roomId)) {
    chatServices.set(roomId, new ChatService(roomId, firestore, auth, storage));
  }
  return chatServices.get(roomId)!;
}

export async function disconnectChatService(roomId: string): Promise<void> {
  const service = chatServices.get(roomId);
  if (service) {
    await service.disconnect();
    chatServices.delete(roomId);
  }
}
