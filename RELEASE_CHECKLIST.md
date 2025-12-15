# 🚀 Release Checklist - Mobile Optimization v0.2.0

## ✅ Що зроблено

### 📱 Mobile-First Optimization
- [x] iOS viewport height fix (`--vh` CSS variable)
- [x] Safe-area insets для notch/home indicator
- [x] Android Chrome address bar fix
- [x] Touch targets мінімум 44px
- [x] Pull-to-refresh вимкнено
- [x] PWA meta tags

### 🔧 Firebase Integration
- [x] `getClientFirebase()` функція
- [x] Firebase Storage підтримка
- [x] FCM imports виправлено
- [x] Logger типізація покращена

### 🎨 UI/UX
- [x] Empty state з емодзі та описом
- [x] Flex layout замість фіксованих висот
- [x] Smooth scroll performance

### 🐛 Bug Fixes
- [x] TypeScript errors виправлено
- [x] React Hooks dependencies додано
- [x] Import errors виправлено

## 📋 Testing Checklist

### Manual Testing
- [ ] **iOS Safari** - відкрити на iPhone (реальному або симуляторі)
  - [ ] Перевірити viewport height
  - [ ] Перевірити safe-area (notch)
  - [ ] Перевірити keyboard behavior
  - [ ] Перевірити pull-to-refresh (має бути вимкнено)

- [ ] **Android Chrome** - відкрити на Android пристрої
  - [ ] Перевірити address bar behavior
  - [ ] Перевірити touch targets (мінімум 44px)
  - [ ] Перевірити keyboard behavior
  - [ ] Перевірити text size adjust

- [ ] **Desktop** - перевірити на Chrome/Firefox
  - [ ] Layout не зламаний
  - [ ] Всі функції працюють

### Functional Testing
- [ ] **Empty State** - відкрити новий чат
  - [ ] Має показуватись емодзі 💬
  - [ ] Заголовок "Сообщений пока нет"
  - [ ] Опис "Напишите первое сообщение..."

- [ ] **Message Input** - надіслати повідомлення
  - [ ] Input видимий на мобільному
  - [ ] Не ховається за клавіатурою
  - [ ] Send button працює

- [ ] **Firebase** - перевірити підключення
  - [ ] Firestore працює
  - [ ] Storage працює (якщо використовується)
  - [ ] FCM готовий до використання

## 🔧 Build & Deploy

### Local Build Test
```bash
# 1. Очистити попередню збірку
rm -rf .next

# 2. Зібрати проєкт
npm run build

# 3. Запустити production локально
npm start

# 4. Перевірити на http://localhost:3000
```

### Vercel Deploy
```bash
# 1. Переконатись що всі env vars встановлені в Vercel Dashboard
# - NEXT_PUBLIC_FIREBASE_API_KEY
# - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# - NEXT_PUBLIC_FIREBASE_PROJECT_ID
# - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# - NEXT_PUBLIC_FIREBASE_APP_ID
# - NEXT_PUBLIC_FIREBASE_DATABASE_URL
# - NEXT_PUBLIC_FIREBASE_VAPID_KEY

# 2. Deploy
vercel --prod

# 3. Перевірити deployment URL
```

### Firebase Deploy (якщо потрібно)
```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy

# 3. Перевірити на Firebase Hosting URL
```

## 🧪 E2E Tests (Optional)

```bash
# Якщо є E2E тести
npm run test:e2e
```

## 📊 Performance Checklist

- [ ] **Lighthouse Score** (Mobile)
  - [ ] Performance > 90
  - [ ] Accessibility > 90
  - [ ] Best Practices > 90
  - [ ] SEO > 90

- [ ] **Core Web Vitals**
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1

## 🔒 Security Checklist

- [ ] Немає hardcoded secrets в коді
- [ ] `.env.local` в `.gitignore`
- [ ] Firebase rules налаштовані
- [ ] CORS налаштований правильно

## 📝 Documentation

- [ ] README оновлено
- [ ] CHANGELOG оновлено
- [ ] PR description заповнено

## ✅ Ready to Merge

Коли всі чекбокси вище відмічені:

1. Перевести PR з Draft в Ready for Review
2. Отримати approve від reviewer (якщо потрібно)
3. Merge в main
4. Deploy на production

---

## 🎯 Наступні кроки після мерджу

1. **FCM Integration** - додати push notifications
2. **Telegram-like UX** - swipe gestures, haptics
3. **Production Rules** - Firebase security rules
4. **Monitoring** - додати error tracking (Sentry)

---

**PR Link:** https://github.com/donkeyhotshow/chatus/pull/30
**Status:** 🟡 Draft (Ready for Testing)
