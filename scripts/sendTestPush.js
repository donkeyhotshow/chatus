#!/usr/bin/env node
/**
 * Usage:
 *   SERVICE_ACCOUNT_PATH=./service-account.json node scripts/sendTestPush.js <TOKEN> [silent|notification] [unreadCount]
 *
 * Requires a service account JSON file. Set SERVICE_ACCOUNT_PATH or place service-account.json in repo root.
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const servicePath = process.env.SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'service-account.json');
if (!fs.existsSync(servicePath)) {
  console.error('Service account file not found at', servicePath);
  process.exit(2);
}

const serviceAccount = JSON.parse(fs.readFileSync(servicePath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const token = process.argv[2];
const mode = process.argv[3] || 'notification';
const unread = process.argv[4] || '1';

if (!token) {
  console.error('Usage: node scripts/sendTestPush.js <TOKEN> [silent|notification] [unreadCount]');
  process.exit(2);
}

async function send() {
  try {
    let message;
    if (mode === 'silent') {
      message = {
        token,
        data: {
          type: 'silent',
          unread: String(unread),
        },
      };
    } else {
      message = {
        token,
        notification: {
          title: 'Test push',
          body: 'This is a test notification',
        },
        data: {
          roomId: 'test-room',
        },
      };
    }

    const res = await admin.messaging().send(message);
    console.log('Message sent, id=', res);
  } catch (err) {
    console.error('Send error', err);
    process.exit(3);
  }
}

send();


