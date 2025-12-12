# Realtime Database rules for ChatUS

This document describes the Realtime Database security rules added to `database.rules.json`, how to deploy them and how to test locally using the Firebase emulator.

## Goals
- Prevent public reads/writes to the Realtime Database.
- Validate structure of `/messages` (require `text`, `ts`, `senderId`).
- Ensure `senderId` equals authenticated `auth.uid`.
- Limit `text` length to 1000 characters.

## Rules summary
- Global: only authenticated users may read/write.
- `/messages/$messageId`: each message must contain `text` (string, max 1000), `ts` (number), `senderId` (string equal to `auth.uid`).
- `/test` is also restricted to authenticated users.

## File added
- `database.rules.json` (at repo root)

## Deploy rules (production)
1. Make sure you are authenticated with the Firebase CLI and the correct project is selected:

```bash
firebase login
firebase use studio-5170287541-f2fb7
```

2. Deploy only database rules:

```bash
firebase deploy --only database:rules
```

If your project uses a hosting/site target or different project alias, adjust the `firebase use` or add `--project` accordingly.

## Test rules locally (emulator)
1. Start the emulator (requires `firebase-tools` with emulators installed):
```bash
firebase emulators:start --only database,auth
```
2. In a separate terminal, run a node script or use `curl` against the emulator REST endpoint to test reads/writes.

## Testing with anonymous auth
1. Enable Anonymous sign-in in Firebase Console → Authentication → Sign-in method.
2. From client:
```javascript
import { getAuth, signInAnonymously } from "firebase/auth";
const auth = getAuth();
await signInAnonymously(auth);
// now reads/writes allowed per rules
```

## Rollback / emergency
- If a rule blocks legitimate traffic, revert by redeploying previous `database.rules.json` or temporarily set:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Only use the temporary open rule for immediate debugging — do not leave it in production.

## Next steps (recommended)
- Add validation for message content (e.g., disallow links or filter profanity) if needed.
- Add rate-limiting via server-side checks or Cloud Functions if you expect heavy write traffic.
- Add CI step to run the emulator and test rules on PRs.


