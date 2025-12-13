# Secrets и деплой: что добавить и как запустить

Ниже — список секретов и шаги для безопасного добавления в GitHub и Vercel. Workflow `deploy-firebase-vercel.yml` использует эти секреты.

1) GitHub Secrets (Repository → Settings → Secrets → Actions)
- `FIREBASE_TOKEN` — CI token для Firebase CLI. Получить: `firebase login:ci` (локально) и вставить.
- `FIREBASE_PROJECT_ID` — идентификатор Firebase проекта (например `studio-5170287541-f2fb7`).
- `VERCEL_TOKEN` — Personal Token из Vercel (Account → Tokens).
- `VERCEL_ORG_ID` — (опционально) org/team id для Vercel.
- `VERCEL_PROJECT_ID` — (опционально) project id or project slug.

2) Vercel Environment Variables (Project Settings → Environment Variables)
- Добавьте следующие переменные для `Preview` и `Production` окружений:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

3) Как локально получить нужные токены
- Firebase CI token:
  ```bash
  npm i -g firebase-tools
  firebase login
  firebase login:ci
  ```
  Скопируйте выданный токен в `FIREBASE_TOKEN`.

- Vercel token:
  - В Vercel → Settings → Tokens → Create Token. Скопируйте в `VERCEL_TOKEN`.

4) Запуск workflow вручную
- После добавления секретов можно:
  - Запушить в `main` (merge PR), workflow запустится автоматически.
  - Или запустить вручную через Actions → выберите `Deploy Firebase & Vercel` → Run workflow.

5) Локальный деплой (если нужен контроль)
- Deploy Firebase:
  ```bash
  firebase deploy --only firestore,storage,functions --project <PROJECT_ID>
  ```
- Deploy Vercel:
  ```bash
  vercel --prod --token <VERCEL_TOKEN>
  ```

6) Безопасность
- Никогда не публикуйте токены/ключи в чатах или репозитории.
- Токены храните в Secrets GitHub / Environment Vercel.


