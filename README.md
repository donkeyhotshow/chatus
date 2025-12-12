# ChatForUs

"ChatForUs" — это многофункциональная платформа для общения и совместной работы в реальном времени, созданная на базе Next.js и Firebase. Она сочетает в себе классический чат с уникальными интерактивными возможностями, такими как совместное рисование и кооперативные мини-игры.

## Ключевые Возможности

### 1. Система Комнат и Профилей
- **Создание и Присоединение:** Пользователи могут легко создавать приватные чат-комнаты, получая уникальный 6-значный код, или присоединяться к существующим комнатам по коду.
- **Кастомные Пиксельные Аватары:** Перед входом в чат каждый пользователь создаёт свой уникальный профиль, рисуя собственный 16x16 пиксельный аватар и выбирая имя. Эта персонализация делает общение более живым и узнаваемым.
- **Анонимная Аутентификация:** Приложение использует анонимную аутентификацию Firebase для бесшовного и безопасного входа без необходимости регистрации.

### 2. Функциональный Чат в Реальном Времени
- **Обмен Сообщениями:** Мгновенный обмен текстовыми сообщениями.
- **Мультимедиа:** Возможность загружать и отправлять изображения прямо в чат.
- **Креативное Общение:**
  - **Doodle Pad:** Встроенная мини-рисовалка позволяет отправлять быстрые наброски и рисунки.
  - **Стикеры:** Коллекция стикеров для выражения эмоций.
- **Интерактивность:**
  - **Ответы на Сообщения:** Цитируйте и отвечайте на конкретные сообщения, чтобы поддерживать контекст беседы.
  - **Реакции:** Реагируйте на сообщения с помощью эмодзи.
  - **Индикаторы набора текста:** Видно, когда собеседник печатает сообщение.

### 3. Пространство для Совместной Работы (Collaboration Space)
Это уникальная боковая панель, которая превращает чат в полноценную интерактивную среду.

- **Многостраничный Общий Холст (Shared Canvas):**
  - **Совместное Рисование:** Все участники комнаты могут рисовать на общем холсте в реальном времени.
  - **Продвинутые Инструменты:** Выбирайте из различных кистей (обычная, неоновая, каллиграфическая, пунктирная), настраивайте толщину и цвет линии.
  - **Несколько Листов:** Создавайте несколько "листов" холста для разных идей или задач.

- **Игровая Комната (Game Lobby):**
  - **Коллекция Мини-Игр:** Начните совместную игру прямо в чате. Доступны классические игры, такие как "Крестики-нолики", "Камень, ножницы, бумага", "Война кликов" и "Бросок костей".
  - **Кооперативные Испытания:**
    - **Совместный Лабиринт:** На холсте генерируется лабиринт, который участники должны пройти вместе.
    - **Песочница с Физикой:** Интерактивная среда, где можно создавать объекты и наблюдать за их физическим взаимодействием.
    - **Tower Defense:** Кооперативная игра, где игроки вместе строят башни для защиты от волн врагов.

- **Список Участников:** Просматривайте, кто из пользователей в данный момент находится онлайн в комнате.

## Технический Стек
- **Фронтенд:** Next.js, React, TypeScript, Tailwind CSS, ShadCN UI
- **Бэкенд и Реал-тайм:** Firebase (Firestore, Firebase Storage, Firebase Authentication)
- **Интерактив:** Matter.js для физической песочницы

"ChatForUs" — это не просто чат, а гибкое и увлекательное пространство для общения, творчества и развлечений.

---

## 🏗️ Архитектура и Использование Сервисов

### Унифицированный подход к работе с комнатами

Проект использует **единый подход** к работе с комнатами через `useRoomManager` хук. Это обеспечивает:
- ✅ Единый источник истины для состояния комнаты
- ✅ Автоматическое управление подписками
- ✅ Правильную очистку ресурсов
- ✅ Защиту от race conditions

### Примеры использования

#### 1. Базовое использование в компоненте

```typescript
import { useRoomManager } from '@/hooks/useRoomManager';
import { UserProfile } from '@/lib/types';

function MyChatComponent({ roomId, user }: { roomId: string, user: UserProfile }) {
  const {
    state,
    joinRoom,
    leaveRoom,
    sendMessage,
    isConnected,
    isLoading
  } = useRoomManager(roomId);

  // Присоединение к комнате
  useEffect(() => {
    joinRoom(user, false).catch(err => {
      console.error('Failed to join room', err);
    });

    return () => {
      leaveRoom().catch(console.error);
    };
  }, [user, roomId, joinRoom, leaveRoom]);

  // Отправка сообщения
  const handleSend = async (text: string) => {
    await sendMessage({
      text,
      user,
      senderId: user.id,
      type: 'text'
    });
  };

  return (
    <div>
      {isLoading && <div>Загрузка...</div>}
      {isConnected && (
        <div>
          <div>Сообщений: {state.messages.length}</div>
          <div>Онлайн: {state.onlineUsers.length}</div>
        </div>
      )}
    </div>
  );
}
```

#### 2. Работа с играми

```typescript
import { useRoomManager } from '@/hooks/useRoomManager';

function GameComponent({ roomId, user }: Props) {
  const { updateGameState, state } = useRoomManager(roomId);

  const handleGameAction = async () => {
    await updateGameState('game-id', {
      scores: { [user.id]: 100 },
      active: true
    });
  };

  const gameState = state.gameStates['game-id'];
  // ...
}
```

#### 3. Работа с холстом

```typescript
import { useRoomManager } from '@/hooks/useRoomManager';

function CanvasComponent({ roomId }: { roomId: string }) {
  const { createCanvasSheet, saveCanvasPath } = useRoomManager(roomId);

  const handleCreateSheet = async () => {
    const sheetRef = await createCanvasSheet('My Drawing');
    // ...
  };

  const handleDraw = async (pathData: CanvasPath) => {
    await saveCanvasPath(pathData);
  };
}
```

### Доступные методы useRoomManager

```typescript
interface UseRoomManagerReturn {
  // Состояние
  state: RoomManagerState;
  
  // Управление комнатой
  joinRoom: (user: UserProfile, validateRoom?: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  
  // Сообщения
  sendMessage: (messageData: Omit<Message, 'id' | 'createdAt' | 'reactions' | 'readBy'>, clientMessageId?: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string, user: UserProfile) => Promise<void>;
  setTypingStatus: (username: string, isTyping: boolean) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
  
  // Игры
  updateGameState: (gameId: string, newState: Partial<GameState>) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  
  // Холст
  createCanvasSheet: (name: string) => Promise<DocumentReference>;
  saveCanvasPath: (pathData: Omit<CanvasPath, 'id' | 'createdAt'>) => Promise<void>;
  clearCanvasSheet: (sheetId: string) => Promise<void>;
  
  // Прямой доступ (для расширенного использования)
  roomManager: RoomManager | null;
  
  // Флаги состояния
  isLoading: boolean;
  isConnected: boolean;
}
```

### Миграция с useChatService

Если вы используете `useChatService` напрямую, рекомендуется перейти на `useRoomManager`:

**Было:**
```typescript
const { service, messages, onlineUsers } = useChatService(roomId, user);
await service?.joinRoom(user, false);
await service?.sendMessage({ ... });
```

**Стало:**
```typescript
const { state, joinRoom, sendMessage } = useRoomManager(roomId);
await joinRoom(user, false);
await sendMessage({ ... });
// state.messages, state.onlineUsers доступны напрямую
```

### Важные замечания

1. **Автоматическая очистка:** `useRoomManager` автоматически управляет подписками. Не вызывайте `disconnect()` вручную в cleanup функциях компонентов.

2. **Singleton паттерн:** `RoomManager` использует singleton паттерн на комнату. Это означает, что несколько компонентов могут использовать один и тот же экземпляр без конфликтов.

3. **Оптимизация производительности:** Хук автоматически предотвращает лишние re-render'ы через оптимизированное сравнение состояния.

---

## 📤 Загрузка на GitHub

### Быстрая загрузка (автоматическая)

1. **Получите GitHub Personal Access Token:**
   - Перейдите: https://github.com/settings/tokens
   - Создайте "Classic" токен с правами `repo`
   - Скопируйте токен

2. **Установите переменную окружения:**
   ```bash
   export GH_TOKEN=ваш_токен_здесь
   ```
   Или в PowerShell:
   ```powershell
   $env:GH_TOKEN = 'ваш_токен_здесь'
   ```

3. **Запустите скрипт загрузки:**
   ```bash
   # Для Linux/Mac
   chmod +x upload-to-github.sh
   ./upload-to-github.sh

   # Для Windows PowerShell
   .\upload-to-github.ps1
   ```

### Ручная загрузка

Если автоматическая загрузка не сработала:

1. Создайте репозиторий на GitHub вручную
2. Добавьте remote:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ChatForUs.git
   git push -u origin main
   ```

---

## 🧪 Тестирование

### Запуск тестов

```bash
# Unit тесты
npm run test:unit

# Тесты в watch режиме
npm run test:unit -- --watch
```

### Примеры тестов

#### Тест useRoomManager

```typescript
// tests/hooks/useRoomManager.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useRoomManager } from '@/hooks/useRoomManager';

describe('useRoomManager', () => {
  it('should initialize room manager', async () => {
    const { result } = renderHook(() => useRoomManager('test-room'));
    
    await waitFor(() => {
      expect(result.current.roomManager).not.toBeNull();
    });
  });

  it('should join room successfully', async () => {
    const user = { id: 'user1', name: 'Test User', avatar: '' };
    const { result } = renderHook(() => useRoomManager('test-room'));
    
    await result.current.joinRoom(user, false);
    
    expect(result.current.isConnected).toBe(true);
  });
});
```

#### Тест ChatService

```typescript
// tests/services/ChatService.test.ts
import { ChatService } from '@/services/ChatService';

describe('ChatService', () => {
  it('should prevent duplicate messages', async () => {
    const service = new ChatService('room1', firestore, auth, storage);
    const messageId = 'test-message-id';
    
    await service.sendMessage({ ... }, messageId);
    // Попытка отправить дубликат должна быть проигнорирована
    await service.sendMessage({ ... }, messageId);
    
    // Проверяем, что сообщение отправлено только один раз
  });
});
```

---

## 🚀 Полный процесс деплоя (Firebase + Vercel)

### ⚡ Быстрый старт (автоматизированный)

```bash
# 1. Установите GitHub токен
$env:GH_TOKEN = 'ваш_github_token'

# 2. Загрузите проект на GitHub
.\upload-to-github.ps1

# 3. Настройте секреты и запустите деплой
.\deploy-complete-setup.ps1
```

### 📋 Пошаговая инструкция

#### **Этап 1: Загрузка на GitHub**
```bash
# Получите токен: https://github.com/settings/tokens (scope: repo)
$env:GH_TOKEN = 'ваш_токен'
.\upload-to-github.ps1
```

#### **Этап 2: Настройка секретов**
```bash
# После загрузки на GitHub:
.\deploy-complete-setup.ps1
```

**Ручная настройка секретов:**
GitHub → Settings → Secrets and variables → Actions:
- `FIREBASE_PROJECT_ID`: `studio-5170287541-f2fb7`
- `FIREBASE_TOKEN`: [Firebase Console → Project Settings → Service accounts]
- `VERCEL_TOKEN`: [Vercel Dashboard → Account Settings → Tokens]
- `VERCEL_ORG_ID`: [Vаш team ID в Vercel]
- `VERCEL_PROJECT_ID`: `prj_jMEdSQ7nEXvMDow8wTUN405EvRxA`

#### **Этап 3: Запуск деплоя**
1. **Через push**: `git push origin main`
2. **Через Actions**: GitHub → Actions → "Deploy Firebase & Vercel" → "Run workflow"

### 🏗️ Архитектура деплоя

**Firebase (Backend):**
- Cloud Functions (API endpoints)
- Firestore Database (правила безопасности)
- Cloud Storage (правила доступа)
- Realtime Database (опционально)

**Vercel (Frontend):**
- Next.js приложение
- PWA (Service Worker)
- Автоматическое масштабирование
- CDN и edge functions

### 🔗 Финальные URL

- **Frontend**: `https://chatforus.vercel.app`
- **Backend**: Firebase API (автоматически интегрируется)
- **API Docs**: Доступны через Vercel dashboard

---

## 📚 Дополнительная документация

- [Архитектура сервисов](./docs/adr/chat-service-architecture.md)
- [Стратегия тестирования](./docs/adr/testing-strategy.md)
- [Отчет о рефакторинге](./docs/REFACTORING_REPORT.md)
- [Аудит игровых режимов](./docs/GAME_AUDIT_REPORT.md)
