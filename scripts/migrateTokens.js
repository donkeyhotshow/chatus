#!/usr/bin/env node
/**
 * Migrate legacy tokens from users/{userId}.fcmTokens (array) to fcmTokens/{token} documents.
 *
 * Usage:
 *   SERVICE_ACCOUNT_PATH=./service-account.json node scripts/migrateTokens.js
 *
 * Or set FIREBASE_SERVICE_ACCOUNT env to JSON string.
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const servicePath = process.env.SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'service-account.json');
let cred;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (fs.existsSync(servicePath)) {
  cred = JSON.parse(fs.readFileSync(servicePath, 'utf8'));
} else {
  console.error('Service account not provided. Set SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT.');
  process.exit(2);
}

admin.initializeApp({
  credential: admin.credential.cert(cred),
});

const db = admin.firestore();

async function migrate() {
  console.log('Starting migration: scanning users collection...');
  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.size} users`);
  let total = 0;
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const userId = doc.id;
    const tokens = data?.fcmTokens || [];
    for (const t of tokens) {
      const token = t?.token || (typeof t === 'string' ? t : null);
      if (!token) continue;
      total++;
      try {
        await db.collection('fcmTokens').doc(token).set({
          userId,
          token,
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.error('Failed to write token', token, e);
      }
    }
  }
  console.log(`Migration finished. Migrated ${total} tokens.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error', err);
  process.exit(3);
});


