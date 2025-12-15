# 🚀 Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Переконайтесь, що всі змінні оточення налаштовані:

#### Vercel Dashboard
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Firebase Configuration

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rooms
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      
      // Messages
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && 
          resource.data.senderId == request.auth.uid;
      }
    }
    
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // FCM Tokens
    match /fcmTokens/{token} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Realtime Database Rules
```json
{
  "rules": {
    "presence": {
      "connections": {
        "$userId": {
          ".read": true,
          ".write": "$userId === auth.uid"
        }
      },
      "status": {
        "$userId": {
          ".read": true,
          ".write": "$userId === auth.uid"
        }
      }
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat-images/{userId}/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔧 Deployment Options

### Option 1: Vercel (Recommended)

#### A. Via Vercel Dashboard

1. **Підключити GitHub репозиторій**
   - Зайти на https://vercel.com
   - New Project → Import Git Repository
   - Вибрати `donkeyhotshow/chatus`

2. **Налаштувати Environment Variables**
   - Settings → Environment Variables
   - Додати всі змінні з `.env.local`

3. **Deploy**
   - Vercel автоматично задеплоїть при push в main
   - Або вручну: Deploy → Production

#### B. Via CLI

```bash
# 1. Встановити Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Перевірити URL
# Vercel покаже deployment URL
```

### Option 2: Firebase Hosting

```bash
# 1. Встановити Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Ініціалізувати (якщо ще не зроблено)
firebase init hosting

# 4. Build
npm run build

# 5. Deploy
firebase deploy --only hosting

# 6. Перевірити URL
# Firebase покаже hosting URL
```

### Option 3: Custom Server

```bash
# 1. Build
npm run build

# 2. Start production server
npm start

# 3. Налаштувати reverse proxy (nginx/Apache)
# 4. Налаштувати SSL (Let's Encrypt)
# 5. Налаштувати PM2 для автозапуску
pm2 start npm --name "chatus" -- start
pm2 save
pm2 startup
```

---

## 🧪 Post-Deployment Testing

### 1. Smoke Tests

```bash
# Відкрити deployment URL
# Перевірити:
- [ ] Головна сторінка завантажується
- [ ] Можна створити/зайти в чат
- [ ] Можна надіслати повідомлення
- [ ] Firebase підключення працює
- [ ] Немає console errors
```

### 2. Mobile Testing

```bash
# Відкрити на реальному пристрої:
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Перевірити viewport height
- [ ] Перевірити keyboard behavior
- [ ] Перевірити safe-area
```

### 3. Performance Testing

```bash
# Lighthouse audit
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90
```

---

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Створити `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # ... інші env vars
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Очистити кеш
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working

```bash
# Перевірити що всі змінні встановлені
vercel env ls

# Додати відсутні
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
```

### Firebase Connection Issues

```bash
# Перевірити Firebase config
# Переконатись що всі API keys правильні
# Перевірити Firebase Console → Project Settings
```

---

## 📊 Monitoring

### Vercel Analytics

```bash
# Увімкнути в Vercel Dashboard
Settings → Analytics → Enable
```

### Firebase Analytics

```bash
# Вже налаштовано в коді
# Перевірити в Firebase Console → Analytics
```

### Error Tracking (Optional)

```bash
# Додати Sentry
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## ✅ Deployment Complete!

Після успішного deployment:

1. ✅ Перевірити всі функції на production
2. ✅ Запустити smoke tests
3. ✅ Перевірити на мобільних пристроях
4. ✅ Моніторити помилки перші 24 години
5. ✅ Оновити документацію з production URL

---

**Production URL:** [Буде після deployment]
**Status:** 🟢 Ready to Deploy
