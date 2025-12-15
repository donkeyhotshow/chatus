# Продвинутые стратегии деплоя

## Обзор

Этот гайд покрывает продвинутые техники деплоя для комплексных приложений на Vercel и Firebase, включая многоэтапныеои, A/B тестирование, и автоматизацию CI/CD.

## Blue-Green деплой

### Концепция

Blue-Green деплой позволяет иметь две идентичные продакшн среды и мгновенно переключаться между ними.

### Реализация с Vercel

```bash
# 1. Деплой новой версии (Green)
vercel --prod --name=myapp-green

# 2. Тестирование Green версии
curl https://myapp-green.vercel.app/health

# 3. Переключение трафика на Green
vercel alias set myapp-green.vercel.app myapp.com

# 4. Откат на Blue при проблемах
vercel alias set myapp-blue.vercel.app myapp.com
```

### Реализация с Firebase

```bash
# 1. Деплой в отдельный проект
firebase use myapp-green
firebase deploy

# 2. Переключение DNS на новый проект
# (требует ручного изменения DNS записей)

# 3. Откат через DNS
# (возврат DNS записей на предыдущий проект)
```

## Canary деплой

### Настройка Canary с Vercel

```bash
# 1. Деплой Canary версии
vercel --prod --name=myapp-canary

# 2. Настройка маршрутизации трафика (через vercel.json)
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "https://myapp-canary.vercel.app/$1",
      "headers": {
        "x-canary": "true"
      },
      "continue": true
    }
  ]
}

# 3. Постепенное увеличение трафика
# Используйте внешний load balancer или CDN для управления трафиком
```

### Мониторинг Canary деплоя

```bash
# Мониторинг метрик через Vercel Analytics
vercel analytics --project=myapp-canary

# Сравнение ошибок между версиями
vercel logs --project=myapp-main | grep ERROR
vercel logs --project=myapp-canary | grep ERROR
```

## Автоматизация CI/CD

### GitHub Actions для Vercel + Firebase

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel and Firebase

on:
  push:
    branches: [main]
  pull_request:
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
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build application
      run: npm run build

    - name: Deploy to Vercel (Preview)
      if: github.event_name == 'pull_request'
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

    - name: Deploy to Vercel (Production)
      if: github.ref == 'refs/heads/main'
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'

    - name: Deploy to Firebase
      if: github.ref == 'refs/heads/main'
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        projectId: your-firebase-project-id
```

### Настройка секретов GitHub

```bash
# Получение токенов
vercel login
vercel whoami  # получить org-id и project-id

firebase login:ci  # получить CI токен

# Добавить в GitHub Secrets:
# VERCEL_TOKEN
# VERCEL_ORG_ID
# VERCEL_PROJECT_ID
# FIREBASE_SERVICE_ACCOUNT (JSON ключ сервисного аккаунта)
```

## Многоэтапный деплой

### Стратегия окружений

```bash
# 1. Development (автоматический деплой из dev ветки)
git checkout dev
vercel --name=myapp-dev

# 2. Staging (автоматический деплой из staging ветки)
git checkout staging
vercel --name=myapp-staging
firebase use myapp-staging
firebase deploy

# 3. Production (ручной деплой из main ветки)
git checkout main
vercel --prod
firebase use myapp-prod
firebase deploy
```

### Управление конфигурацией по окружениям

```bash
# Vercel - переменные по окружениям
vercel env add API_URL development
vercel env add API_URL preview
vercel env add API_URL production

# Firebase - разные проекты
firebase use myapp-dev
firebase functions:config:set api.url="https://dev-api.example.com"

firebase use myapp-staging
firebase functions:config:set api.url="https://staging-api.example.com"

firebase use myapp-prod
firebase functions:config:set api.url="https://api.example.com"
```

## A/B тестирование

### Настройка A/B тестов с Vercel

```javascript
// middleware.js для Next.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Определение варианта A/B теста
  const variant = Math.random() < 0.5 ? 'A' : 'B'

  // Перенаправление на соответствующий деплой
  if (variant === 'B' && request.nextUrl.pathname.startsWith('/')) {
    return NextResponse.rewrite(new URL(`https://myapp-variant-b.vercel.app${request.nextUrl.pathname}`))
  }

  return NextResponse.next()
}
```

### Мониторинг A/B тестов

```bash
# Сбор метрик для каждого варианта
vercel analytics --project=myapp-variant-a
vercel analytics --project=myapp-variant-b

# Анализ конверсии через Firebase Analytics
firebase open analytics
```

## Оптимизация производительности деплоя

### Кэширование зависимостей

```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["dist/**"]
      }
    }
  ],
  "functions": {
    "app/api/**/*.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### Оптимизация Firebase Functions

```javascript
// functions/index.js
const functions = require('firebase-functions')

// Кэширование модулей
let cachedModule = null

exports.optimizedFunction = functions.https.onRequest(async (req, res) => {
  // Ленивая загрузка модулей
  if (!cachedModule) {
    cachedModule = require('./heavy-module')
  }

  // Переиспользование соединений с БД
  // ...
})
```

## Мониторинг и алерты

### Настройка мониторинга Vercel

```bash
# Интеграция с внешними сервисами мониторинга
vercel integration add datadog
vercel integration add sentry

# Настройка webhook для алертов
vercel webhook add https://your-monitoring-service.com/webhook
```

### Мониторинг Firebase

```javascript
// Настройка алертов в Firebase Console
// 1. Перейти в Monitoring
// 2. Создать алерт для Functions
// 3. Настроить условия (error rate, latency)
// 4. Добавить каналы уведомлений (email, Slack)
```

## Безопасность продвинутых деплоев

### Защита staging окружений

```bash
# Vercel - защита паролем
vercel env add VERCEL_PASSWORD staging

# Firebase - правила безопасности для staging
// firestore.rules для staging
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null &&
        request.auth.token.email.matches('.*@yourcompany.com');
    }
  }
}
```

### Ротация ключей

```bash
# Автоматическая ротация API ключей
# Скрипт для обновления ключей во всех окружениях
#!/bin/bash

NEW_API_KEY=$(generate-new-api-key)

# Обновление в Vercel
vercel env rm API_KEY production
vercel env add API_KEY production <<< "$NEW_API_KEY"

# Обновление в Firebase
firebase functions:config:unset api.key
firebase functions:config:set api.key="$NEW_API_KEY"
firebase deploy --only functions
```

## Откат и восстановление

### Автоматический откат при ошибках

```bash
# Скрипт мониторинга и автоматического отката
#!/bin/bash

# Проверка health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://myapp.com/health)

if [ $HEALTH_STATUS -ne 200 ]; then
  echo "Health check failed, rolling back..."

  # Откат Vercel
  PREVIOUS_DEPLOYMENT=$(vercel ls --meta | grep -v "CURRENT" | head -1 | awk '{print $1}')
  vercel promote $PREVIOUS_DEPLOYMENT

  # Уведомление команды
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 Automatic rollback triggered for myapp.com"}' \
    $SLACK_WEBHOOK_URL
fi
```

### Backup стратегии

```bash
# Создание снапшотов перед деплоем
firebase firestore:export gs://myapp-backups/$(date +%Y%m%d-%H%M%S)

# Backup конфигурации Vercel
vercel env ls > vercel-env-backup-$(date +%Y%m%d).txt
```

## Заключение

Продвинутые стратегии деплоя требуют тщательного планирования и мониторинга. Начните с простых техник и постепенно внедряйте более сложные по мере роста вашего приложения и команды.

Ключевые принципы:
- Автоматизируйте все что можно
- Мониторьте каждый деплой
- Имейте план отката
- Тестируйте в изолированных окружениях
- Документируйте все процессы
