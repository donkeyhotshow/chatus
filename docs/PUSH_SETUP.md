# Настройка Push-уведомлений (FCM)

## Обзор
Данный документ описывает процесс настройки и интеграции push-уведомлений в приложение с использованием Firebase Cloud Messaging (FCM) для доставки сообщений пользователям.

## Компоненты
1.  **Service Worker (`public/firebase-messaging-sw.js`):** Обрабатывает фоновые (background) сообщения, когда приложение не активно или закрыто. Отвечает за отображение уведомлений пользователю.
2.  **Клиентский модуль FCM (`src/lib/firebase-messaging.ts`):** Управляет запросом разрешений на уведомления, получением FCM-токена устройства и сохранением его в Firestore. Также обрабатывает сообщения, приходящие в активном состоянии приложения (foreground messages).
3.  **Интеграция с `FirebaseProvider` (`src/components/firebase/FirebaseProvider.tsx`):** Инициализирует клиентский модуль FCM, когда пользователь аутентифицирован.

## Процесс настройки

### 1. Конфигурация Firebase
Убедитесь, что ваш проект Firebase настроен для работы с FCM. Вам потребуется:
*   `messagingSenderId` в `firebaseConfig` (получается из настроек проекта Firebase).
*   **VAPID Key:** Сгенерируйте пару ключей VAPID в консоли Firebase (Project settings > Cloud Messaging > Web configuration > Generate key pair). Публичный ключ VAPID необходимо сохранить в переменной окружения `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

### 2. Service Worker (`public/firebase-messaging-sw.js`)

Этот файл должен быть размещен в папке `public/`, чтобы быть доступным по корневому пути вашего домена. 

**Важно:** Замените плейсхолдеры в `firebase.initializeApp` на актуальные значения из вашего проекта Firebase. Их можно найти в настройках проекта Firebase (Project settings -> General -> Your apps -> Web app -> Config).

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'New message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/firebase-logo.png', // Убедитесь, что иконка существует
    badge: '/badge-icon.png', // Убедитесь, что бейдж существует
    tag: payload.data?.roomId || 'default',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const roomId = event.notification.data?.roomId;
  if (roomId) {
    event.waitUntil(
      clients.openWindow(`/chat/${roomId}`)
    );
  }
});
```

### 3. Клиентский модуль FCM (`src/lib/firebase-messaging.ts`)

Этот модуль отвечает за взаимодействие с FCM на стороне клиента:

*   Запрос разрешения на показ уведомлений.
*   Получение уникального FCM-токена для текущего устройства/браузера.
*   Сохранение FCM-токена в коллекции Firestore `users/{userId}/fcmTokens`.
*   Обработка уведомлений, приходящих, когда приложение находится в активном состоянии.

### 4. Интеграция в `FirebaseProvider`

`FCMManager` инициализируется в `FirebaseProvider` после аутентификации пользователя. Это гарантирует, что FCM-токены ассоциируются с конкретным пользователем.

### 5. Отправка Push-уведомлений (Серверная часть)

Для отправки push-уведомлений с сервера необходимо использовать **Firebase Admin SDK**. Типичный сценарий — Cloud Function, которая срабатывает на событие (например, создание нового сообщения в чате) и отправляет уведомления всем участникам комнаты, исключая отправителя.

Пример Cloud Function для отправки сообщений:

```typescript
// functions/src/sendNotifications.ts (пример)
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Инициализация Admin SDK (обычно делается один раз при старте функций)
// admin.initializeApp();

export const sendMessageNotification = functions.firestore
  .document('rooms/{roomId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const roomId = context.params.roomId;
    const senderId = message?.senderId;

    // Получаем участников комнаты
    const roomDoc = await admin.firestore().doc(`rooms/${roomId}`).get();
    const participants = roomDoc.data()?.participants || [];

    // Фильтруем (не отправляем отправителю)
    const recipients = participants.filter((id: string) => id !== senderId);

    // Получаем токены всех получателей
    const tokenPromises = recipients.map(async (userId: string) => {
      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      return userDoc.data()?.fcmTokens?.map((t: any) => t.token) || [];
    });

    const tokenArrays = await Promise.all(tokenPromises);
    const tokens = tokenArrays.flat();

    if (tokens.length === 0) return;

    // Отправляем уведомление
    const payload = {
      notification: {
        title: `Новое сообщение от ${message?.senderName || 'Неизвестный'}`,
        body: message?.content?.substring(0, 100) || ''
      },
      data: {
        roomId,
        messageId: snapshot.id,
        type: 'new_message'
      }
    };

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: payload.notification,
        data: payload.data
      });
      console.log(`Sent FCM to ${tokens.length} recipients in room ${roomId}`);
    } catch (error) {
      console.error(`Error sending FCM message for room ${roomId}:`, error);
    }
  });
```

### 6. Деплой

*   **Service Worker:** Просто убедитесь, что `public/firebase-messaging-sw.js` попадает в сборку вашего фронтенда.
*   **Клиентский код:** Деплой фронтенд приложения.
*   **Cloud Functions (если используете):** `firebase deploy --only functions`.

### 7. Тестирование

*   Проверьте, что приложение запрашивает разрешение на уведомления.
*   Убедитесь, что FCM-токены сохраняются в Firestore для пользователя.
*   Отправьте тестовое сообщение, находясь в другой вкладке/браузере, чтобы проверить фоновые уведомления.
*   Отправьте тестовое сообщение, находясь в активной вкладке, чтобы проверить foreground-обработку.

## Важные замечания

*   **`NEXT_PUBLIC_FIREBASE_VAPID_KEY`:** Эта переменная окружения *критически важна* для получения FCM-токенов в браузере. Убедитесь, что она установлена.
*   **Иконки уведомлений:** Убедитесь, что файлы `public/firebase-logo.png` и `public/badge-icon.png` существуют, или замените их на актуальные пути.
*   **Обработка ошибок:** Добавьте более надежную обработку ошибок и логирование для production-среды.
