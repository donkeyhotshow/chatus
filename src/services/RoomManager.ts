'use client';

/**
 * RoomManager - Менеджер состояния комнаты
 * 
 * Управляет всеми аспектами комнаты:
 * - Участники и их профили
 * - Сообщения (с пагинацией)
 * - Игры и их состояния
 * - Холст (canvas sheets и paths)
 * - Подписки Firestore
 * 
 * Архитектура: Singleton на комнату для изоляции состояния
 */

import {
  Firestore, Unsubscribe
} from "firebase/firestore";
import { Auth } from "firebase/auth";
import { FirebaseStorage } from "firebase/storage";
import { ChatService, getChatService } from "./ChatService";
import { logger } from "@/lib/logger";
import type { UserProfile, Message, GameState, Room } from "@/lib/types";

type RoomManagerListener = () => void;

export interface RoomManagerState {
  room: Room | null;
  messages: Message[];
  onlineUsers: UserProfile[];
  typingUsers: string[];
  gameStates: { [gameId: string]: GameState };
  hasMoreMessages: boolean;
  isInitialLoad: boolean;
  isConnected: boolean;
}

/**
 * RoomManager - централизованное управление состоянием комнаты
 * 
 * Преимущества:
 * - Изоляция состояния между комнатами
 * - Автоматическая очистка подписок
 * - Легкое масштабирование
 * - Упрощенная отладка
 */
export class RoomManager {
  private roomId: string;
  private firestore: Firestore;
  private auth: Auth;
  private storage: FirebaseStorage;
  
  // Внутренний ChatService для этой комнаты
  private chatService: ChatService;
  
  // Состояние комнаты
  private state: RoomManagerState = {
    room: null,
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    gameStates: {},
    hasMoreMessages: true,
    isInitialLoad: true,
    isConnected: false,
  };
  
  // Подписки для очистки
  private unsubscribes: Unsubscribe[] = [];
  
  // Слушатели изменений состояния
  private listeners: RoomManagerListener[] = [];
  
  // Защита от race conditions
  private isJoining: boolean = false;
  private joinPromise: Promise<void> | null = null;
  
  constructor(
    roomId: string,
    firestore: Firestore,
    auth: Auth,
    storage: FirebaseStorage
  ) {
    this.roomId = roomId;
    this.firestore = firestore;
    this.auth = auth;
    this.storage = storage;
    
    // Получаем ChatService для этой комнаты (уже Singleton на комнату)
    this.chatService = getChatService(roomId, firestore, auth, storage);
    
    // Подписываемся на изменения ChatService
    this.chatService.subscribe(() => {
      this.syncStateFromChatService();
    });
    
    // Инициализируем состояние
    this.syncStateFromChatService();
  }
  
  /**
   * Синхронизирует состояние RoomManager из ChatService
   */
  private syncStateFromChatService() {
    this.state = {
      room: this.state.room, // Room загружается отдельно
      messages: [...this.chatService.messages],
      onlineUsers: [...this.chatService.onlineUsers],
      typingUsers: [...this.chatService.typingUsers],
      gameStates: { ...this.chatService.gameStates },
      hasMoreMessages: this.chatService.hasMoreMessages,
      isInitialLoad: this.chatService.isInitialLoad,
      isConnected: true,
    };
    
    this.notify();
  }
  
  /**
   * Получить текущее состояние
   */
  public getState(): RoomManagerState {
    return { ...this.state };
  }
  
  /**
   * Подписаться на изменения состояния
   */
  public subscribe(listener: RoomManagerListener) {
    this.listeners.push(listener);
    return () => this.unsubscribe(listener);
  }
  
  /**
   * Отписаться от изменений
   */
  public unsubscribe(listener: RoomManagerListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Уведомить всех слушателей об изменении
   */
  private notify() {
    this.listeners.forEach(listener => listener());
  }
  
  /**
   * Присоединиться к комнате
   */
  public async joinRoom(user: UserProfile, validateRoom: boolean = false): Promise<void> {
    // Защита от race conditions
    if (this.isJoining && this.joinPromise) {
      return this.joinPromise;
    }
    
    this.isJoining = true;
    this.joinPromise = (async () => {
      try {
        await this.chatService.joinRoom(user, validateRoom);
        this.state.isConnected = true;
        this.notify();
      } finally {
        this.isJoining = false;
        this.joinPromise = null;
      }
    })();
    
    return this.joinPromise;
  }
  
  /**
   * Покинуть комнату
   */
  public async leaveRoom(): Promise<void> {
    await this.chatService.leaveRoom();
    this.state.isConnected = false;
    this.notify();
  }
  
  /**
   * Отправить сообщение
   */
  public async sendMessage(
    messageData: Omit<Message, 'id' | 'createdAt' | 'reactions' | 'delivered' | 'seen'>,
    clientMessageId?: string
  ): Promise<void> {
    return this.chatService.sendMessage(messageData, clientMessageId);
  }
  
  /**
   * Загрузить больше сообщений (пагинация)
   */
  public async loadMoreMessages(): Promise<void> {
    return this.chatService.loadMoreMessages();
  }
  
  /**
   * Удалить сообщение
   */
  public async deleteMessage(messageId: string): Promise<void> {
    return this.chatService.deleteMessage(messageId);
  }
  
  /**
   * Переключить реакцию на сообщение
   */
  public async toggleReaction(
    messageId: string,
    emoji: string,
    user: UserProfile
  ): Promise<void> {
    return this.chatService.toggleReaction(messageId, emoji, user);
  }
  
  /**
   * Установить статус набора текста
   * TODO: Restore when ChatService implements setTypingStatus
   */
  /*
  public async setTypingStatus(username: string, isTyping: boolean): Promise<void> {
    return this.chatService.setTypingStatus(username, isTyping);
  }
  */
  
  /**
   * Загрузить изображение
   */
  public async uploadImage(file: File): Promise<string> {
    return this.chatService.uploadImage(file);
  }
  
  /**
   * Обновить состояние игры
   */
  public async updateGameState(gameId: string, newState: Partial<GameState>): Promise<void> {
    return this.chatService.updateGameState(gameId, newState);
  }
  
  /**
   * Удалить игру
   */
  public async deleteGame(gameId: string): Promise<void> {
    return this.chatService.deleteGame(gameId);
  }
  
  /**
   * Создать лист холста
   */
  public async createCanvasSheet(name: string) {
    return this.chatService.createCanvasSheet(name);
  }
  
  /**
   * Сохранить путь рисования
   */
  public async saveCanvasPath(pathData: Omit<import("@/lib/types").CanvasPath, 'id' | 'createdAt'>) {
    return this.chatService.saveCanvasPath(pathData);
  }
  
  /**
   * Очистить лист холста
   */
  public async clearCanvasSheet(sheetId: string) {
    return this.chatService.clearCanvasSheet(sheetId);
  }
  
  /**
   * Получить ChatService (для обратной совместимости)
   */
  public getChatService(): ChatService {
    return this.chatService;
  }
  
  /**
   * Отключиться и очистить все ресурсы
   */
  public async disconnect(): Promise<void> {
    // Отписаться от ChatService
    this.chatService.unsubscribe(() => this.syncStateFromChatService());
    
    // Отключить ChatService
    await this.chatService.disconnect();
    
    // Очистить все подписки
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
    
    // Очистить слушатели
    this.listeners = [];
    
    // Сбросить состояние
    this.state = {
      room: null,
      messages: [],
      onlineUsers: [],
      typingUsers: [],
      gameStates: {},
      hasMoreMessages: true,
      isInitialLoad: true,
      isConnected: false,
    };
    
    logger.info("RoomManager disconnected", { roomId: this.roomId });
  }
  
  /**
   * Получить ID комнаты
   */
  public getRoomId(): string {
    return this.roomId;
  }
}

// ============================================================================
// Singleton management per room
// ============================================================================

const roomManagers = new Map<string, RoomManager>();

/**
 * Получить RoomManager для комнаты (Singleton на комнату)
 * 
 * @param roomId - ID комнаты
 * @param firestore - Экземпляр Firestore
 * @param auth - Экземпляр Auth
 * @param storage - Экземпляр Storage
 * @returns RoomManager для указанной комнаты
 */
export function getRoomManager(
  roomId: string,
  firestore: Firestore,
  auth: Auth,
  storage: FirebaseStorage
): RoomManager {
  if (!roomManagers.has(roomId)) {
    roomManagers.set(roomId, new RoomManager(roomId, firestore, auth, storage));
    logger.info("RoomManager created", { roomId });
  }
  return roomManagers.get(roomId)!;
}

/**
 * Отключить и удалить RoomManager для комнаты
 * 
 * @param roomId - ID комнаты
 */
export async function disconnectRoomManager(roomId: string): Promise<void> {
  const manager = roomManagers.get(roomId);
  if (manager) {
    await manager.disconnect();
    roomManagers.delete(roomId);
    logger.info("RoomManager deleted", { roomId });
  }
}

/**
 * Получить все активные комнаты (для отладки)
 */
export function getActiveRoomIds(): string[] {
  return Array.from(roomManagers.keys());
}

/**
 * Очистить все RoomManager (для тестов)
 */
export async function clearAllRoomManagers(): Promise<void> {
  const disconnectPromises = Array.from(roomManagers.values()).map(manager => 
    manager.disconnect()
  );
  await Promise.all(disconnectPromises);
  roomManagers.clear();
  logger.info("All RoomManagers cleared");
}

