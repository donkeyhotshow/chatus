# Руководство по тестированию

## Обзор

Проект использует **Vitest** для unit-тестов и **@testing-library/react** для тестирования React компонентов.

## Запуск тестов

```bash
# Запустить все тесты один раз
npm run test:unit

# Запустить тесты в watch режиме
npm run test:unit -- --watch

# Запустить тесты с покрытием
npm run test:unit -- --coverage

# Запустить конкретный тест
npm run test:unit -- tests/hooks/useRoomManager.test.ts
```

## Структура тестов

```
tests/
├── setup/
│   └── vitest.setup.ts          # Глобальная настройка тестов
├── hooks/
│   └── useRoomManager.test.ts    # Тесты хуков
├── services/
│   ├── ChatService.deduplication.test.ts  # Тесты дедупликации
│   └── ChatService.disconnect.test.ts     # Тесты очистки
└── components/                   # Тесты компонентов (будущие)
```

## Примеры тестов

### Тестирование хуков

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useRoomManager } from '@/hooks/useRoomManager';

describe('useRoomManager', () => {
  it('should initialize correctly', async () => {
    const { result } = renderHook(() => useRoomManager('test-room'));
    
    await waitFor(() => {
      expect(result.current.roomManager).not.toBeNull();
    });
  });
});
```

### Тестирование сервисов

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ChatService } from '@/services/ChatService';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService('room1', firestore, auth, storage);
  });

  it('should prevent duplicate messages', async () => {
    const msgId = 'test-msg';
    await service.sendMessage({ ... }, msgId);
    // Дубликат должен быть проигнорирован
    await service.sendMessage({ ... }, msgId);
  });
});
```

### Тестирование компонентов

```typescript
import { render, screen } from '@testing-library/react';
import { ChatArea } from '@/components/chat/ChatArea';

describe('ChatArea', () => {
  it('should render messages', () => {
    render(<ChatArea user={mockUser} roomId="room1" />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
```

## Моки и утилиты

### Моки Firebase

```typescript
vi.mock('@/components/firebase/FirebaseProvider', () => ({
  useFirebase: () => ({
    db: mockFirestore,
    auth: mockAuth,
    storage: mockStorage
  })
}));
```

### Моки сервисов

```typescript
vi.mock('@/services/RoomManager', () => ({
  getRoomManager: vi.fn(() => mockRoomManager)
}));
```

## Best Practices

1. **Изолируйте тесты:** Каждый тест должен быть независимым
2. **Используйте моки:** Мокайте внешние зависимости
3. **Проверяйте граничные случаи:** Пустые массивы, null значения
4. **Тестируйте ошибки:** Проверяйте обработку ошибок
5. **Используйте описательные имена:** `should prevent duplicate messages`

## Покрытие кода

Целевое покрытие:
- **Критичные сервисы:** ≥80%
- **Хуки:** ≥70%
- **Компоненты:** ≥60%

Проверить покрытие:
```bash
npm run test:unit -- --coverage
```

## Отладка тестов

```typescript
// Использовать console.log в тестах
console.log('Debug info:', result.current);

// Использовать debug() из testing-library
import { screen } from '@testing-library/react';
screen.debug(); // Выведет DOM дерево
```

## CI/CD

Тесты автоматически запускаются в CI при:
- Push в main ветку
- Создании Pull Request
- Ручном запуске workflow

