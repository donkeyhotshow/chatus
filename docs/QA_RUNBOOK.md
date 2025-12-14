# QA Runbook — FCM / Presence / SW E2E

This runbook contains step-by-step instructions for QA to validate FCM, silent push, badge handling, presence and Cloud Functions.

## Preconditions
- Ensure Preview build is deployed and accessible.
- Ensure Vercel envs set for Preview: all `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, `PUSH_API_SECRET`.
- Have `service-account.json` for admin scripts (stored securely, not committed).

## Useful commands
- SW availability:
  ```bash
  curl -I https://<preview-domain>/firebase-messaging-sw.js
  ```
- Send test push (node):
  ```bash
  SERVICE_ACCOUNT_PATH=./service-account.json node scripts/sendTestPush.js <TOKEN> notification
  SERVICE_ACCOUNT_PATH=./service-account.json node scripts/sendTestPush.js <TOKEN> silent 5
  ```
- Migrate tokens (backup first):
  ```bash
  SERVICE_ACCOUNT_PATH=./service-account.json node scripts/migrateTokens.js
  ```

## Test steps

1. **Register FCM token**
   - Open: `https://<preview-domain>/fcm-test`
   - Click "Register FCM" → allow notifications.
   - Copy token from textarea.
   - Verify token saved:
     - Firestore `fcmTokens/{token}` exists, or `users/{user}.fcmTokens` contains token (legacy).

2. **Notification (foreground / background)**
   - Foreground:
     - Keep tab visible; send notification:
       ```bash
       node scripts/sendTestPush.js <TOKEN> notification
       ```
     - Expect: onMessage handler invoked; optional in-app UI notification.
   - Background:
     - Switch to another tab or close window (app not focused); send notification again.
     - Expect: native notification shown by SW.

3. **Silent push / badge**
   - Send silent:
     ```bash
     node scripts/sendTestPush.js <TOKEN> silent 5
     ```
   - Expect:
     - SW console log `[SW] Background message: ...`
     - No notification shown.
     - Badge updated (if platform supports Badging API).
     - On app focus, UI should sync unread count.

4. **Service Worker checks**
   - DevTools → Application → Service Workers:
     - Confirm `firebase-messaging-sw.js` is registered.
     - Check SW console logs for `onBackgroundMessage` events.
   - Click a notification: SW should focus existing client window or open `/chat/<roomId>`.

5. **Cloud Functions**
   - Create a message in Firestore `rooms/{roomId}/messages` (via UI or emulator).
   - Monitor functions logs:
     ```bash
     firebase functions:log
     ```
   - Expect:
     - `sendMulticast` success results.
     - Invalid tokens are deleted from `fcmTokens`.

6. **Token migration spot-check**
   - Backup Firestore (export).
   - Run migration script:
     ```bash
     SERVICE_ACCOUNT_PATH=./service-account.json node scripts/migrateTokens.js
     ```
   - Spot-check several users: `fcmTokens/{token}` created linking to expected userId.

## Acceptance criteria
- Preview: `/fcm-test` registers token and pushes work as expected (notification + silent + badge).  
- SW registered and shows logs.  
- Functions deliver pushes and remove invalid tokens.  
- Token migration correctly populated `fcmTokens` for sampled users.  

## Escalation
- If push fails for all devices: check Vercel envs (VAPID), SW file (public path) and admin credentials.
- If many invalid tokens: pause migration and rollback `fcmTokens` (restore from backup).


