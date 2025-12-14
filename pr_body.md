[Firebase] FCM + Presence + SW + Token migration + E2E tools

## Summary
This PR fixes Firebase initialization, implements a connection-count presence model, stabilizes FCM (real notifications + silent push + badge), migrates token storage to `fcmTokens`, updates Cloud Functions for multicast + invalid-token cleanup, and adds E2E tools and a test page for QA.

## Changelog (by file)
- `.env.local` — corrected storage bucket, removed duplicates.
- `src/lib/firebase.ts` — SSR-safe, idempotent init.
- `src/lib/firebase-messaging.ts` — getToken with VAPID, save token to `fcmTokens/{token}` and legacy `users/{user}.fcmTokens`, foreground handler, token refresh.
- `src/lib/messaging.ts` — client helpers: `initMessaging`, `registerFCM`, `onForegroundMessage`.
- `src/lib/presence.ts` — connection-count model with push + onDisconnect + activeConnections.
- `public/firebase-messaging-sw.js` — silent push handling, badge, improved notificationclick.
- `functions/src/index.ts` — read `fcmTokens`, batch send, cleanup invalid tokens.
- `scripts/sendTestPush.js` — admin test push (notification / silent).
- `scripts/migrateTokens.js` — migrate legacy tokens from `users/*` → `fcmTokens`.
- `pages/api/sendPush.ts` — server API route for push (protected by `PUSH_API_SECRET`).
- `pages/fcm-test.tsx` — test UI to register FCM and trigger test pushes.
- `docs/PUSH_SETUP.md` — updated instructions and testing notes.

## What this PR introduces / fixes
- Full FCM flow with VAPID, SW and server-side send route.
- Silent push handling in SW (no auto-notification + badge update).
- Presence reliable across multiple tabs via connection-count.
- Token storage migration tooling and server cleanup of invalid tokens.
- E2E and QA tooling: test page, send script, migration script.

## PRE-PR blockers addressed
- Env: corrected storage bucket and removed duplicates. MUST sync Vercel envs (Preview & Prod).
- Token storage mismatch: client writes to `fcmTokens`, functions read `fcmTokens`.
- Presence race condition fixed (connection-count + onDisconnect).
- Silent push auto-notification removed.
- Duplicate Firebase init removed; file is SSR-safe.

## E2E checklist (must pass before merge)
1. Sync all `NEXT_PUBLIC_FIREBASE_*` in Vercel (Preview + Production).
2. Backup Firestore.
3. On Preview build:
   - Open `/fcm-test` → Register FCM → copy token.
   - Send real notification (foreground/background): `node scripts/sendTestPush.js <TOKEN> notification`
   - Send silent push: `node scripts/sendTestPush.js <TOKEN> silent 5` — verify no notification + badge update.
   - Verify SW registration and SW logs: DevTools → Application → Service Workers.
   - Verify Cloud Function logs: `firebase functions:log` — multicast and invalid-token cleanup.
4. Run migration script (backup first): `SERVICE_ACCOUNT_PATH=./service-account.json node scripts/migrateTokens.js` — spot-check migrated tokens.
5. Deploy rules & functions, then frontend to prod. Verify `/fcm-test` on prod and run push tests on a real device.

## Rollback / contingency
- If SW/push broken: revert frontend commit and redeploy previous build; if needed remove `public/firebase-messaging-sw.js` then redeploy.
- If migration issues: restore Firestore from backup and delete newly created `fcmTokens` docs.
- If functions misbehave: revert and redeploy previous functions version.

## Status
- 🔴 BLOCKED — E2E required on real device(s) and Vercel env parity verification.

## How to create the Draft PR (example)
1. Save this file as `PR_BODY.md`.
2. Create branch and push:
   ```bash
   git checkout -b feature/fcm-presence-sw-improvements
   git add -A
   git commit -m "feat: FCM + Presence + SW + token migration + E2E tools"
   git push -u origin feature/fcm-presence-sw-improvements
   ```
3. Create draft PR using GitHub CLI:
   ```bash
   gh pr create --draft --title "[Firebase] FCM + Presence + SW + Token migration + E2E tools" --body-file PR_BODY.md --base main
   ```

Attach this PR to QA and mark BLOCKED until E2E completes.

# Краткое описание

Добавлены скрипты pre-flight проверки и GitHub Actions workflow для автоматической проверки окружения, секретов и сборки перед мержем.



# Что сделано

- scripts/prepr-checks.sh / .ps1  проверка окружения, портов, .env.local, установка зависимостей, сборка; генерируется prepr-report.json.

- scripts/check-secrets.sh / .ps1  проверка на коммит секретов.

- .github/workflows/prepr-checks.yml  запускает prepr-checks на PR, завершает job с ошибкой, если overall_status !== PASS.

- README/ADR/ENV примеры обновлены с инструкциями по prepr-checks.



# Pre-flight чек-лист (для PR)

- [ ] Локально выполнено: bash scripts/prepr-checks.sh --fix

- [ ] Локально выполнено: bash scripts/prepr-checks.sh, prepr-report.json показывает "overall_status":"PASS"

- [ ] Локально проверено: npm run lint и npx tsc --noEmit  ошибок нет

- [ ] Скрипты .sh и .ps1 протестированы на Linux/Windows

- [ ] GitHub workflow запущен, артефакт prepr-report.json доступен

- [ ] Временные флаги/guards документированы

- [ ] README/ADR обновлены с инструкциями



# Runbook / Инструкции для мержера

- Workflow prepr-checks должен пройти на CI перед мержем.

- В случае падения job  проверить prepr-report.json, исправить ошибки локально и повторно запушить.

- В PR комментариях можно ссылаться на prepr-report артефакт.



# Ссылки / Артефакты

- prepr-report.json (CI job artifact)

- Скрипты: scripts/prepr-checks.*, scripts/check-secrets.*

- ADR: docs/ADR-setup.md

