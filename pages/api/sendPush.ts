/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Expect FIREBASE_SERVICE_ACCOUNT env as JSON string or set GOOGLE_APPLICATION_CREDENTIALS
if (!admin.apps.length) {
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Firebase service account not configured for API route');
  }
  try {
    const credential = svc ? JSON.parse(svc) : undefined;
    admin.initializeApp({
      credential: credential ? admin.credential.cert(credential) : undefined,
    });
  } catch (e) {
    console.error('Failed to initialize admin SDK in API route', e);
  }
}


const messaging = admin.messaging();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = req.headers['x-api-key'] || '';
  if (process.env.PUSH_API_SECRET && secret !== process.env.PUSH_API_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { token, mode = 'notification', unread = '1', notification } = req.body || {};

  if (!token) {
    return res.status(400).json({ error: 'token required' });
  }

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
        notification: notification || {
          title: 'Test push from API',
          body: 'This is a test',
        },
        data: { test: '1' },
      };
    }
    const result = await messaging.send(message);
    return res.status(200).json({ result });
  } catch (err: unknown) {
    console.error('API sendPush error', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMessage });
  }
}


