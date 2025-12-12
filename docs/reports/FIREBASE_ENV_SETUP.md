# 🔧 Firebase Environment Setup

## ✅ Firebase проект уже настроен!

**Проект ID:** `studio-5170287541-f2fb7`
**Название:** ChatUs
**Статус:** Активен

## 📋 Firebase сервисы

### ✅ Web App
- **App ID:** `1:671791091944:web:9d7f3ec08cfe73c283f95d`
- **Платформа:** Web
- **Статус:** Активен

### ✅ Firestore Database
- **Коллекции:** rooms, users
- **Статус:** Активна

### ✅ Authentication
- **Статус:** Настроена (анонимная аутентификация)

### ✅ Storage
- **Bucket:** `studio-5170287541-f2fb7.firebasestorage.app`
- **Статус:** Активен

## 🔑 Переменные окружения

Создайте файл `.env.local` в корне проекта со следующим содержимым:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCLVWyPpa8idMJgN038vEPY8ADjARBs1j8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-5170287541-f2fb7.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-5170287541-f2fb7
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-5170287541-f2fb7.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=671791091944
NEXT_PUBLIC_FIREBASE_APP_ID=1:671791091944:web:9d7f3ec08cfe73c283f95d

# Demo mode disabled for production
# NEXT_PUBLIC_DEMO_MODE=true
```

## 🚀 Следующие шаги

1. **Создайте `.env.local`** с данными выше
2. **Протестируйте локально:** `npm run dev`
3. **Загрузите на GitHub** (репозиторий: `donkeyhotshow/ChatForUs`)
4. **Выберите способ деплоя**

## 📝 Примечания

- Файл `.env.local` уже добавлен в `.gitignore`
- Переменные автоматически загрузятся при запуске Next.js
- Для продакшена demo mode должен быть отключен


