---
name: "vercel-firebase-deploy"
displayName: "Vercel & Firebase Deploy"
ription: "Автоматизация деплоя и мониторинга приложений на Vercel и Firebase с единым интерфейсом управления. Поддерживает деплой фронтенда на Vercel и бэкенда/функций на Firebase."
keywords: ["vercel", "firebase", "deploy", "deployment", "hosting", "monitoring", "control"]
author: "Kiro Assistant"
---

# Vercel & Firebase Deploy

## Обзор

Этот power предоставляет комплексное решение для деплоя и управления приложениями на двух ключевых платформах:

**Vercel** - для фронтенд приложений (Next.js, React, Vue, статические сайты)
**Firebase** - для бэкенд сервисов (Cloud Functions, Firestore, Authentication, Hosting)

Power автоматизирует весь процесс деплоя, от подготовки кода до мониторинга производительности, обеспечивая единый интерфейс для управления обеими платформами.

## Доступные MCP серверы

Этот power использует следующие MCP серверы:
- **vercel-cli** - Управление проектами и деплоями Vercel
- **firebase-tools** - Управление Firebase проектами и сервисами
- **git** - Контроль версий и синхронизация кода

## Подготовка к работе

### Предварительные требования

**Системные требования:**
- Node.js 18+
- npm или yarn
- Git
- Аккаунты на Vercel и Firebase

**Необходимые CLI инструменты:**
- Vercel CLI
- Firebase CLI
- Git

### Установка

#### 1. Установка Vercel CLI
```bash
npm install -g vercel
```

#### 2. Установка Firebase CLI
```bash
npm install -g firebase-tools
```

#### 3. Аутентификация

**Vercel:**
```bash
vercel login
```

**Firebase:**
```bash
firebase login
```

### Базовая конфигурация

#### Настройка проекта Vercel
```bash
# В корне проекта
vercel init
# Следуйте инструкциям для связывания с проектом
```

#### Настройка проекта Firebase
```bash
# В корне проекта
firebase init
# Выберите нужные сервисы (Functions, Firestore, Hosting)
```

## Основные рабочие процессы

### Рабочий процесс 1: Полный деплой (Frontend + Backend)

**Цель:** Деплой полного приложения с фронтендом на Vercel и бэкендом на Firebase

**Шаги:**
1. Подготовка и проверка кода
2. Сборка фронтенд приложения
3. Деплой на Vercel
4. Деплой Firebase Functions
5. Обновление конфигурации и переменных окружения
6. Проверка работоспособности

**Пример:**
```bash
# 1. Проверка статуса Git
git status
git add .
git commit -m "Deploy: готов к деплою"

# 2. Деплой на Vercel (фронтенд)
vercel --prod

# 3. Деплой Firebase Functions (бэкенд)
firebase deploy --only functions

# 4. Деплой Firestore правил и индексов
firebase deploy --only firestore

# 5. Проверка деплоя
vercel ls
firebase projects:list
```

**Частые ошибки:**
- Ошибка: "Build failed on Vercel"
  - Причина: Ошибки в коде или неправильная конфигурация
  - Решение: Проверить логи сборки `vercel logs`, исправить ошибки
- Ошибка: "Firebase Functions deployment failed"
  - Причина: Неправильные зависимости или права доступа
  - Решение: Проверить `firebase debug`, обновить зависимости

### Рабочий процесс 2: Деплой только фронтенда (Vercel)

**Цель:** Быстрый деплой изменений фронтенда без затрагивания бэкенда

**Шаги:**
1. Проверка изменений в фронтенд коде
2. Сборка и деплой на Vercel
3. Проверка работоспособности

**Пример:**
```bash
# Предварительный просмотр
vercel

# Продакшн деплой
vercel --prod

# Проверка статуса
vercel ls --scope=team-name
```

### Рабочий процесс 3: Деплой только бэкенда (Firebase)

**Цель:** Обновление серверной логики, функций или правил базы данных

**Шаги:**
1. Проверка изменений в Firebase Functions
2. Деплой функций и правил
3. Тестирование API endpoints

**Пример:**
```bash
# Деплой только функций
firebase deploy --only functions

# Деплой только правил Firestore
firebase deploy --only firestore:rules

# Деплой индексов Firestore
firebase deploy --only firestore:indexes

# Полный деплой Firebase (без Hosting)
firebase deploy --except hosting
```

### Рабочий процесс 4: Мониторинг и управление

**Цель:** Контроль состояния деплоев, просмотр логов и метрик

**Шаги:**
1. Проверка статуса деплоев
2. Просмотр логов и ошибок
3. Мониторинг производительности
4. Управление доменами и переменными

**Пример:**
```bash
# Статус Vercel проектов
vercel ls
vercel inspect [deployment-url]

# Логи Vercel
vercel logs [deployment-url]

# Статус Firebase
firebase projects:list
firebase functions:log

# Мониторинг Firebase
firebase open console
```

### Рабочий процесс 5: Откат деплоя

**Цель:** Быстрый откат к предыдущей рабочей версии при проблемах

**Шаги:**
1. Определение проблемной версии
2. Откат Vercel деплоя
3. Откат Firebase Functions (если нужно)
4. Проверка восстановления

**Пример:**
```bash
# Список деплоев Vercel
vercel ls

# Промоут предыдущего деплоя
vercel promote [previous-deployment-url]

# Откат Firebase Functions к предыдущей версии
# (требует ручного редеплоя предыдущего кода)
git checkout [previous-commit]
firebase deploy --only functions
git checkout main
```

## Устранение неполадок

### Проблемы подключения MCP серверов

**Проблема:** MCP сервер не запускается или не отвечает
**Симптомы:**
- Ошибка: "Connection refused"
- Сервер не отвечает на команды

**Решения:**
1. Проверить установку CLI инструментов:
   ```bash
   vercel --version
   firebase --version
   git --version
   ```
2. Проверить аутентификацию:
   ```bash
   vercel whoami
   firebase projects:list
   ```
3. Перезапустить Kiro и попробовать снова

### Ошибки выполнения инструментов

**Ошибка:** "Authentication required"
**Причина:** Не выполнена аутентификация в CLI
**Решение:**
1. Выполнить `vercel login` или `firebase login`
2. Проверить токены доступа
3. При необходимости перелогиниться

**Ошибка:** "Project not found"
**Причина:** Проект не связан с CLI или удален
**Решение:**
1. Проверить `.vercel/project.json` и `.firebaserc`
2. Переинициализировать проект: `vercel init` или `firebase init`
3. Убедиться в правильности названия проекта

**Ошибка:** "Build failed"
**Причина:** Ошибки в коде или конфигурации сборки
**Решение:**
1. Проверить логи сборки: `vercel logs`
2. Локально протестировать сборку: `npm run build`
3. Проверить переменные окружения в настройках проекта

**Ошибка:** "Insufficient permissions"
**Причина:** Недостаточно прав для деплоя
**Решение:**
1. Проверить роль в команде Vercel/Firebase
2. Запросить права администратора у владельца проекта
3. Убедиться в правильности выбранного проекта

### Проблемы с переменными окружения

**Проблема:** Переменные окружения не применяются
**Причина:** Неправильная конфигурация или область видимости
**Решение:**
1. **Vercel:** Проверить настройки в веб-интерфейсе или через CLI:
   ```bash
   vercel env ls
   vercel env add [name]
   ```
2. **Firebase:** Проверить конфигурацию функций:
   ```bash
   firebase functions:config:get
   firebase functions:config:set key=value
   ```

### Проблемы с доменами

**Проблема:** Кастомный домен не работает
**Причина:** Неправильная настройка DNS или SSL
**Решение:**
роверить DNS записи у регистратора домена
2. Проверить статус домена в Vercel: `vercel domains ls`
3. Дождаться распространения DNS (до 48 часов)
4. Проверить SSL сертификат в настройках проекта

## Лучшие практики

### Организация проекта
- Используйте монорепозиторий для фронтенда и бэкенда
- Настройте отдельные окружения (dev, staging, prod)
- Ведите changelog для отслеживания изменений
- Используйте семантическое версионирование

### Безопасность
- Никогда не коммитьте API ключи в репозиторий
- Используйте переменные окружения для всех секретов
- Настройте правила Firestore для защиты данных
- Регулярно ротируйте API ключи

### Производительность
- Оптимизируйте размер бандла для Vercel
- Используйте кэширование в Firebase Functions
- Настройте CDN для статических ресурсов
- Мониторьте метрики производительности

### Мониторинг
- Настройте алерты для критических ошибок
- Используйте логирование в Firebase Functions
- Мониторьте использование квот и лимитов
- Регулярно проверяйте метрики производительности

### Автоматизация
- Настройте CI/CD пайплайны для автоматического деплоя
- Используйте Git hooks для проверки кода
- Автоматизируйте тестирование перед деплоем
- Настройте автоматические бэкапы данных

## Конфигурация

### Переменные окружения

**Vercel:**
```bash
# Добавление переменной
vercel env add API_URL

# Просмотр переменных
vercel env ls

# Удаление переменной
vercel env rm API_URL
```

**Firebase:**
```bash
# Настройка конфигурации функций
firebase functions:config:set api.url="https://api.example.com"

# Просмотр конфигурации
firebase functions:config:get

# Локальная разработка
firebase functions:config:get > .runtimeconfig.json
```

### Настройка окружений

**Создание staging окружения:**
1. Создать отдельный проект Firebase для staging
2. Настроить отдельный проект Vercel для preview
3. Использовать разные ветки Git для разных окружений

**Пример конфигурации:**
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "@api_url"
    }
  }
}
```

```json
// firebase.json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

## Дополнительные ресурсы

- **Vercel документация:** https://vercel.com/docs
- **Firebase документация:** https://firebase.google.com/docs
- **Vercel CLI справка:** https://vercel.com/docs/cli
- **Firebase CLI справка:** https://firebase.google.com/docs/cli

---

**Платформы:** Vercel, Firebase
**CLI инструменты:** `vercel`, `firebase`, `git`
**Установка:** `npm install -g vercel firebase-tools`
