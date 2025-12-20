// =============================================================================
// MOCK SERVICES FOR TESTING WITHOUT EXTERNAL DEPENDENCIES
// =============================================================================

import { ChatMessage, Room, User } from '@/types';

// Mock data storage
let mockUsersData: User[] = [];
let mockRoomsData: Room[] = [];
let mockMessagesData: ChatMessage[] = [];

// Mock Firebase-like services
export class MockFirebaseService {
  private static instance: MockFirebaseService;
  private listeners: Map<string, Function[]> = new Map();

  static getInstance(): MockFirebaseService {
    if (!MockFirebaseService.instance) {
      MockFirebaseService.instance = new MockFirebaseService();
    }
    return MockFirebaseService.instance;
  }

  // Mock authentication
  async signInAnonymously() {
    const mockUser = {
      uid: `mock-user-${Date.now()}`,
      displayName: 'Mock User',
      email: null,
      isAnonymous: true
    };
    return mockUser;
  }

  // Mock Firestore operations
  collection(path: string) {
    return {
      doc: (id?: string) => ({
        id: id || `mock-${Date.now()}`,
        set: async (data: any) => {
          if (path.includes('rooms')) {
            mockRoomsData.push({ ...data, id: id || `mock-${Date.now()}` });
          }
          return data;
        },
        get: async () => ({
          exists: true,
          data: () => mockRoomsData.find(r => r.id === id) || null
        }),
        update: async (data: any) => {
          const index = mockRoomsData.findIndex(r => r.id === id);
          if (index !== -1) {
            mockRoomsData[index] = { ...mockRoomsData[index], ...data };
          }
        }
      }),
      add: async (data: any) => {
        const newDoc = { ...data, id: `mock-${Date.now()}` };
        if (path.includes('rooms')) {
          mockRoomsData.push(newDoc);
        }
        return newDoc;
      },
      where: (field: string, op: string, value: any) => ({
        get: async () => ({
          docs: mockRoomsData.filter(room => room[field] === value).map(room => ({
            data: () => room,
            id: room.id
          }))
        })
      }),
      onSnapshot: (callback: Function) => {
        this.listeners.set(path, [...(this.listeners.get(path) || []), callback]);
        // Simulate initial data
        setTimeout(() => callback({
          docs: mockRoomsData.map(room => ({
            data: () => room,
            id: room.id
          }))
        }), 100);
      }
    };
  }

  // Mock Realtime Database
  ref(path: string) {
    return {
      on: (event: string, callback: Function) => {
        // Simulate real-time updates
        setTimeout(() => callback({
          val: () => mockMessagesData.filter(m => m.roomId === path.split('/')[1])
        }), 100);
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      push: (_data: any) => ({
        key: `mock-msg-${Date.now()}`,
        set: async (value: any) => {
          mockMessagesData.push({ ...value, id: `mock-msg-${Date.now()}` });
        }
      }),
      off: () => {} // Remove listener
    };
  }
}

// Mock AI service
export class MockAIService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateResponse(_prompt: string): Promise<string> {
    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const responses = [
      "Это тестовый ответ от AI.",
      "Привет! Я работаю в режиме тестирования.",
      "Спасибо за ваш вопрос. Это mock ответ.",
      "В режиме тестирования все функции работают корректно.",
      "Продолжаем тестирование системы..."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Mock room management
export class MockRoomService {
  async createRoom(name: string, creatorId: string): Promise<Room> {
    const room: Room = {
      id: `room-${Date.now()}`,
      name,
      creatorId,
      participants: [creatorId],
      createdAt: new Date(),
      isActive: true
    };

    mockRoomsData.push(room);
    return room;
  }

  async joinRoom(roomId: string, userId: string): Promise<boolean> {
    const room = mockRoomsData.find(r => r.id === roomId);
    if (room && !room.participants.includes(userId)) {
      room.participants.push(userId);
      return true;
    }
    return false;
  }

  getRooms(): Room[] {
    return mockRoomsData;
  }
}

// Mock user service
export class MockUserService {
  async createUser(displayName: string): Promise<User> {
    const user: User = {
      id: `user-${Date.now()}`,
      displayName,
      isOnline: true,
      lastSeen: new Date(),
      avatar: null
    };

    mockUsersData.push(user);
    return user;
  }

  getUsers(): User[] {
    return mockUsersData;
  }
}

// Export mock instances
export const mockFirebase = MockFirebaseService.getInstance();
export const mockAI = new MockAIService();
export const mockRoomService = new MockRoomService();
export const mockUserService = new MockUserService();

// Utility function to check if we're in test mode
export const isTestMode = () => {
  return process.env.NODE_ENV === 'test' ||
         process.env.FIREBASE_OFFLINE_MODE === 'true' ||
         process.env.USE_MOCK_APIS === 'true';
};

// Reset mock data (useful for tests)
export const resetMockData = () => {
  mockUsersData = [];
  mockRoomsData = [];
  mockMessagesData = [];
};
