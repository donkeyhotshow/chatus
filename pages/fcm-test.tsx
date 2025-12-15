'use client';

import { useState } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';

export default function FCMTestPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  async function onRegister() {
    setStatus('Requesting permission / registering SW...');
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      if (!messaging) {
        throw new Error('Firebase Messaging not initialized');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission denied');
      }

      const t = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      setToken(t || null);
      setStatus(t ? 'Registered' : 'No token');
    } catch (e: unknown) {
      setStatus('Registration failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function sendTest(mode: 'notification' | 'silent') {
    setStatus('Sending test push...');
    try {
      const resp = await fetch('/api/sendPush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_PUSH_API_SECRET || '',
        },
        body: JSON.stringify({ token, mode, unread: 3 }),
      });
      const json = await resp.json();
      setStatus('Send result: ' + (json.result || JSON.stringify(json)));
    } catch (e: unknown) {
      setStatus('Send failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>FCM Test</h1>
      <p>{status}</p>
      <div style={{ marginBottom: 8 }}>
        <button onClick={onRegister}>Register FCM (request permission)</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => sendTest('notification')} disabled={!token}>Send notification</button>
        <button onClick={() => sendTest('silent')} disabled={!token} style={{ marginLeft: 8 }}>Send silent</button>
      </div>
      <div>
        <label>Token (copyable):</label>
        <textarea readOnly value={token ?? ''} style={{ width: '100%', height: 140 }} />
      </div>
    </div>
  );
}
