# ChatUs - Product Requirements Document

## Overview
ChatUs - приватное чатожение для общения 1 на 1 с функциями совместного рисования и мини-играми.

## Core Features

### 1. Authentication & Profile
- Создание профиля с никнеймом (3-20 символов, a-zA-Z0-9_)
- Pixel Avatar Editor для создания аватара
- Сохранение профиля в localStorage и Firebase

### 2. Chat Room
- Вход по коду комнаты (3-6 символов, A-Z0-9)
- Создание новой комнаты с генерацией кода
- Real-time сообщения через Firebase Firestore
- Emoji picker и стикеры
- Индикатор "печатает..."
- Поиск по сообщениям

### 3. Canvas (Холст)
- Совместное рисование в реальном времени
- Инструменты: Pen, Eraser
- 12 цветов на выбор
- 4 типа кистей: Normal, Neon, Dashed, Calligraphy
- Толщина линии 1-20px
- Zoom и Pan
- Отправка рисунка в чат
- Remote cursors других пользователей

### 4. Games (Игры)
- TicTacToe (Крестики-нолики)
- Snake Game
- Car Race
- Dice Roll
- Rock Paper Scissors
- Physics World
- VibeJet (3D)
- Tower Defense

### 5. Mobile Experience
- Адаптивный дизайн
- Touch targets минимум 44x44px
- Swipe navigation между вкладками
- Safe area insets для iPhone
- PWA поддержка

### 6. Settings
- Темная тема (по умолчанию)
- Уведомления
- Звуковые эффекты

## Technical Stack
- Next.js 14
- React 18
- TypeScript
- Firebase (Firestore, RTDB, Auth, Storage)
- Tailwind CSS
- Framer Motion
- Three.js (для 3D игр)

## Pages
- `/` - Главная страница с формой входа
- `/chat/[room]` - Чат-комната

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/stickers` - Список стикеров
- `GET /api/stickers/[name]` - Конкретный стикер
- `POST /api/stickers/import` - Импорт стикеров
- `POST /api/games/launch/[gameId]` - Запуск игры

## User Flows

### Flow 1: Вход в чат
1. Открыть главную страницу
2. Ввести никнейм (3-20 символов)
3. Ввести код комнаты или создать новую
4. Нажать "Войти"
5. Создать профиль с аватаром (если первый раз)
6. Попасть в чат-комнату

### Flow 2: Отправка сообщения
1. Ввести текст в поле ввода
2. Нажать Enter или кнопку отправки
3. Сообщение появляется в чате

### Flow 3: Рисование
1. Перейти на вкладку "Холст"
2. Выбрать инструмент и цвет
3. Рисовать на холсте
4. Отправить рисунок в чат (опционально)

### Flow 4: Игра
1. Перейти на вкладку "Игры"
2. Выбрать игру
3. Дождаться второго игрока (если нужно)
4. Играть

## Quality Requirements
- Время загрузки < 3 секунды
- FPS в играх > 30 (mobile), > 60 (desktop)
- Без memory leaks
- Работа offline (базовый функционал)
