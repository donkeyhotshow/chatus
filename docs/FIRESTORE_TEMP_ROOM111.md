## Temporary rule: allow read for room '111'

This file documents the temporary change to `firestore.rules` that allows read access to room with id `111`.

Purpose
- Enable quick debugging and manual testing of room `111` without adding a participant or toggling `public`.

Change made
- In `firestore.rules` inside `match /rooms/{roomId}` the `allow read` condition was temporarily extended:
  - before: `allow read: if isParticipant() || (resource.data.public == true);`
  - now: `allow read: if isParticipant() || (resource.data.public == true) || (roomId == '111');`

Important
- This is a temporary and **insecure** change. Do not merge to production or leave for extended periods.

Revert steps
1. Edit `firestore.rules` and remove the `|| (roomId == '111')` clause.
2. Re-deploy rules:
```bash
firebase deploy --only firestore:rules
```

Verification
- After reverting, verify access control by attempting to read the room as an unauthenticated user — it should be denied unless `public` is true or the user is a participant.


