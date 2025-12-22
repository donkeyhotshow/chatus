# ChatUs - План исправления критических проблем

## 🚨 ФАЗА 1: Критические исправления (Неделя 1-2)

### 1.1 Offline-режим - сообщения теряются

**Файлы:** `src/services/MessageService.ts`, `src/hooks/use-connection-status.tsx`

**Проблема:** При потере соединения сообщения не сохраняются локально

**Решение:**
```typescript
// src/services/OfflineMessageQueue.ts (новый файл)
export class OfflineMessageQueue {
  private queue: Message[] = [];
  private storageKey = 'offline-messages';

  constructor() {
    this.loadFromStorage();
  }

  add(message: Message) {
    this.queue.push(message);
    this.saveToStorage();
  }

  async flush(sendFn: (msg: Message) => Promise<void>) {
    while (this.queue.length > 0) {
      const msg = this.queue[0];
      try {
        await sendFn(msg);
        this.queue.shift();
        this.saveToStorage();
      } catch {
        break; // Still offline
      }
    }
  }

  private loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) this.queue = JSON.parse(data);
  }

  private saveToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
  }
}
```

### 1.2 Синхронизация между вкладками

**Файлы:** `src/hooks/useChatService.ts`

**Проблема:** Сообщения не синхронизируются между вкладками

**Решение:**
```typescript
// Добавить BroadcastChannel API
const channel = new BroadcastChannel('chatus-sync');

channel.onmessage = (event) => {
  if (event.data.type === 'NEW_MESSAGE') {
    // Обновить локальный стейт
  }
};

// При отправке сообщения
channel.postMessage({ type: 'NEW_MESSAGE', message });
```


### 1.3 Индикатор состояния соединения

**Файл:** `src/components/chat/onStatus.tsx` (новый)

```tsx
'use client';

import { useConnectionStatus } from '@/hooks/use-connection-status';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const { isOnline, isReconnecting } = useConnectionStatus();

  if (isOnline && !isReconnecting) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium",
      "flex items-center justify-center gap-2",
      isReconnecting
        ? "bg-yellow-500 text-yellow-950"
        : "bg-red-500 text-white"
    )}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 animate-pulse" />
          Восстановление соединения...
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          Нет соединения. Сообщения будут отправлены при восстановлении.
        </>
      )}
    </div>
  );
}
```

**Интеграция в `src/components/chat/ChatRoom.tsx`:**
```tsx
import { ConnectionStatus } from './ConnectionStatus';

// В return:
<div className="flex h-screen-safe ...">
  <ConnectionStatus />
  {/* остальной контент */}
</div>
```

### 1.4 Доступ к мини-играм

**Файл:** `src/components/chat/ChatSidebar.tsx`

**Проблема:** Игры недоступны из основного интерфейса

**Решение:** Добавить явную навигацию к играм
```tsx
// Убедиться что таб 'games' доступен и виден
const tabs: ChatTab[] = ['chat', 'canvas', 'games', 'users', 'stats'];
```

---

## 🟠 ФАЗА 2: Major исправления (Неделя 3-4)

### 2.1 Виртуальная клавиатура в ландшафте

**Файл:** `src/components/chat/MessageInput.tsx`

```tsx
// Добавить в useEffect
useEffect(() => {
  const handleResize = () => {
    if (textareaRef.current && document.activeElement === textareaRef.current) {
      texaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  window.visualViewport?.addEventListener('resize', handleResize);
  return () => window.visualViewport?.removeEventListener('resize', handleResize);
}, []);
```

### 2.2 Touch targets на мобильных

**Файл:** `src/app/globals.css`

```css
/* Добавить глобальный стиль */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (pointer: coarse) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### 2.3 Tower Defense на мобильных

**Файл:** `src/components/games/TowerDefense.tsx`

**Проблема:** Черный экран на мобильных

**Решение:** Проверить canvas sizing
```tsx
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const updateSize = () => {
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  };

  updateSize();
  window.addEventListener('resize', updateSize);
  return () => window.removeEventListener('resize', updateSize);
}, []);
```


---

## 📋 ФАЗА 3: Minor исправесяц 2)

### 3.1 Динамические Room ID

**Файл:** `src/app/page.tsx`

```tsx
// Генерация уникального room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Кнопка создания новой комнаты
<Button onClick={() => router.push(`/chat/${generateRoomId()}`)}>
  Создать новую комнату
</Button>
```

### 3.2 Демо-режим улучшения

**Файл:** `src/lib/demo-mode.ts`

```typescript
// Добавить mock данные для демо
export const DEMO_MESSAGES = [
  { id: '1', text: 'Привет! Это демо-режим', sender: 'Demo User', timestamp: Date.now() },
  { id: '2', text: 'Попробуй отправить сообщение', sender: 'Demo Bot', timestamp: Date.now() },
];

export const DEMO_USERS = [
  { id: 'demo-1', name: 'Demo User', avatar: '👤', online: true },
  { id: 'demo-2', name: 'Demo Bot', avatar: '🤖', online: true },
];
```

### 3.3 Валидация форм

**Файл:** `src/components/chat/ProfileCreationDialog.tsx`

```tsx
// Улучшенная валидация
const validateUsername = (name: string) => {
  if (name.length < 2) return 'Минимум 2 символа';
  if (name.length > 20) return 'Максимум 20 символов';
  if (!/^[a-zA-Zа-яА-Я0-9_]+$/.test(name)) return 'Только буквы, цифры и _';
  return null;
};
```

---

## 🎯 ФАЗА 4: Оптимизация (Месяц 3)

### 4.1 Кросс-браузерная совместимость

**Проверить:**
- Safari: CSS backdrop-filter
- Firefox: scrollbar-hide
- Edge: все анимации

### 4.2 Performance оптимизация

```typescript
// Добавить в next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};
```

---

## ✅ ЧЕКЛИСТ ИСПРАВЛЕНИЙ

### Критические (Неделя 1-2)
- [ ] Offline message queue
- [ ] Connection status indicator
- [ ] Tab sync via BroadcastChannel
- [ ] Games navigation fix
- [ ] Profile creation flow

### Major (Неделя 3-4)
- [ ] Virtual keyboard handling
- [ ] Touch targets 44x44px
- [ ] Tower Defense mobile fix
- [ ] Push notifications setup
- [ ] User presence updates

### Minor (Месяц 2)
- [ ] Dynamic room IDs
- [ ] Demo mode improvements
- [ ] Form validation
- [ ] Error messages UX
- [ ] Loading states

### Enhancement (Месяц 3)
- [ ] Cross-browser testing
- [ ] Performance audit
- [ ] Accessibility audit
- [ ] Final polish

---

## 📊 МЕТРИКИ УСПЕХА

| Метрика | Текущее | Цель |
|---------|---------|------|
| Page Load | 4000ms | <2000ms |
| FCP | 400ms | <400ms ✅ |
| Offline support | ❌ | ✅ |
| Mobile UX score | 6/10 | 9/10 |
| Функциональность | 7/10 | 9/10 |

---

*План создан: 2025-12-20*
*Ожидаемое завершение: 3 месяца*
