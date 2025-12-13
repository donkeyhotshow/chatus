# Пример `.env.local` для Firebase (локальная разработка)

Скопируйте значения из Firebase Console → Project settings → Your apps (Web) и вставьте в файл `.env.local` в корне проекта.

Пример:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-chat-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-chat-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-chat-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=987654321
NEXT_PUBLIC_FIREBASE_APP_ID=1:987654321:web:abcdef1234567890
```

- Не коммитьте реальные ключи в репозиторий.
- После изменения перезапустите dev-сервер: `npm run dev`.


