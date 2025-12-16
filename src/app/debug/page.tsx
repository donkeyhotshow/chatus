'use client';

import { useEffect, useState } from 'react';
import { getClientFirese } from '@/lib/firebase';

export default function DebugPage() {
    const [status, setStatus] = useState<string>('Initializing...');
    const [firebaseStatus, setFirebaseStatus] = useState<any>({});

    useEffect(() => {
        const checkFirebase = async () => {
            try {
                setStatus('Checking Firebase...');

                const { app, firestore, auth, rtdb, messaging, analytics, storage } = getClientFirebase();

                setFirebaseStatus({
                    app: !!app,
                    firestore: !!firestore,
                    auth: !!auth,
                    rtdb: !!rtdb,
                    messaging: !!messaging,
                    analytics: !!analytics,
                    storage: !!storage,
                });

                if (app) {
                    setStatus('Firebase initialized successfully');
                } else {
                    setStatus('Firebase not initialized');
                }

                // Test Firestore connection
                if (firestore) {
                    setStatus('Testing Firestore connection...');
                    // Simple test - just check if we can create a reference
                    const testRef = firestore._delegate || firestore;
                    setStatus('Firestore connection OK');
                }

            } catch (error) {
                setStatus(`Error: ${(error as Error).message}`);
                console.error('Firebase check error:', error);
            }
        };

        checkFirebase();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Firebase Debug</h1>

            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Status:</h2>
                <p className="text-green-400">{status}</p>
            </div>

            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Firebase Services:</h2>
                <ul className="space-y-1">
                    {Object.entries(firebaseStatus).map(([service, available]) => (
                        <li key={service} className={available ? 'text-green-400' : 'text-red-400'}>
                            {service}: {available ? '✓' : '✗'}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Environment Variables:</h2>
                <ul className="space-y-1 text-sm">
                    <li>API_KEY: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓' : '✗'}</li>
                    <li>PROJECT_ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓' : '✗'}</li>
                    <li>AUTH_DOMAIN: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓' : '✗'}</li>
                    <li>DATABASE_URL: {process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ? '✓' : '✗'}</li>
                </ul>
            </div>

            <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
            >
                Back to Home
            </button>
        </div>
    );
}
