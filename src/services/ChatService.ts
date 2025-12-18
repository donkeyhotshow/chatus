'use client';

import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, where, Unsubscribe, deleteDoc, doc, runTransaction, limit, setDoc, getDoc, Firestore, writeBatch, getDocs, DocumentReference, DocumentSnapshot, startAfter, Timestamp, arrayRemove, DocumentData
} from "firebase/firestore";
import { Auth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";
import { isDemoMode } from "@/lib/demo-mode";
import { logger } from "@/lib/logger";
import { Message, CanvasPath, Reaction, UserProfile, GameState, Room, FirebaseError } from "@/lib/types";
import { withRetryAndTimeout } from "@/lib/utils";
import { getMessageQueue } from "./MessageQueue";
import { MessageService } from "./MessageService";
import { PresenceService } from "./PresenceService";
import { GameService } from "./GameService";

type ChatServiceListener = () => void;

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

  // Race condition protection
  private isJoining: boolean = false;
  private joinPromise: Promise<void> | null = null;

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
    this.messages = this.messageService.messages;
    this.onlineUsers = this.presenceService.onlineUsers;
    this.typingUsers = this.presenceService.typingUsers;
    this.gameStates = this.gameService.gameStates;
    this.isInitialLoad = this.messageService.isInitialLoad;
    this.hasMoreMessages = this.messageService.hasMoreMessages;
    this.notify();
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

  public async joinRoom(user: UserProfile, isNewRoom: boolean = false): Promise<void> {
    if (this.isJoining) return this.joinPromise || Promise.resolve();
    this.isJoining = true;

    this.joinPromise = (async () => {
      try {
        this.currentUser = user;
        this.messageService.setCurrentUser(user);
        this.presenceService.setCurrentUser(user);

        if (isDemoMode()) {
          this.initListeners();
          return;
        }

        const roomRef = doc(this.firestore, 'rooms', this.roomId);
        await runTransaction(this.firestore, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);

          if (!roomDoc.exists()) {
            transaction.set(roomRef, {
              id: this.roomId,
              participants: [user.id],
              participantProfiles: [user],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            const data = roomDoc.data() as Room;
            const participants = data.participants || [];
            const profiles = data.participantProfiles || [];

            if (!participants.includes(user.id)) {
              participants.push(user.id);
              profiles.push(user);
              transaction.update(roomRef, {
                participants,
                participantProfiles: profiles,
                updatedAt: serverTimestamp(),
              });
            }
          }
        });

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
      const roomRef = doc(this.firestore, 'rooms', this.roomId);
      await runTransaction(this.firestore, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) return;

        const data = roomDoc.data() as Room;
        const participants = (data.participants || []).filter(id => id !== this.currentUser?.id);
        const profiles = (data.participantProfiles || []).filter(p => p.id !== this.currentUser?.id);

        transaction.update(roomRef, {
          participants,
          participantProfiles: profiles,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      logger.error("Error leaving room", error as Error, { roomId: this.roomId });
    }
  }

  public async loadMoreMessages() {
    return this.messageService.loadMoreMessages();
  }

  public async sendMessage(messageData: any, clientMessageId?: string) {
    return this.messageService.sendMessage(messageData, clientMessageId);
  }

  public async deleteMessage(messageId: string) {
    return this.messageService.deleteMessage(messageId);
  }

  public async toggleReaction(messageId: string, emoji: string, user: UserProfile) {
    return this.messageService.toggleReaction(messageId, emoji, user);
  }

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
    if (this.currentUser) await this.leaveRoom();

    this.messageService.disconnect();
    this.presenceService.disconnect();
    this.gameService.disconnect();

    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];

    this.currentUser = null;
    this.isJoining = false;
    this.joinPromise = null;

    const mq = this._messageQueue ?? getMessageQueue();
    mq.setSendCallback(() => Promise.reject(new Error('Disconnected')));
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
