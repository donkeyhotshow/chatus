'usclient';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { signInAnonymously } from 'firebase/auth';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { logger } from '@/lib/logger';

export default function ChatTestPage() {
    const { auth, rtdb, user } = useFirebase();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Auto sign in anonymously
    useEffect(() => {
        if (auth && !user) {
            signInAnonymously(auth)
                .then(() => {
                    logger.info('ChatTest: Signed in anonymously');
                    setIsLoading(false);
                })
                .catch((err) => {
                    logger.error('ChatTest: Failed to sign in', err);
                    setError('Failed to sign in');
                    setIsLoading(false);
                });
        } else if (user) {
            setIsLoading(false);
        }
    }, [auth, user]);

    // Listen to messages
    useEffect(() => {
        if (!rtdb || !user) return;

        const messagesRef = ref(rtdb, 'rooms/TEST/messages');
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const messagesList = Object.entries(data).map(([id, msg]: [string, any]) => ({
                    id,
                    ...msg
                }));
                messagesList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                setMessages(messagesList);
            } else {
                setMessages([]);
            }
        });

        return () => unsubscribe();
    }, [rtdb, user]);

    const sendMessage = async () => {
        if (!rtdb || !user || !newMessage.trim()) return;

        try {
            const messagesRef = ref(rtdb, 'rooms/TEST/messages');
            await push(messagesRef, {
                text: newMessage.trim(),
                userId: user.uid,
                username: `User_${user.uid.slice(-4)}`,
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            setNewMessage('');
        } catch (err) {
            logger.error('ChatTest: Failed to send message', err as Error);
            setError('Failed to send message');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Initializing chat test...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 text-red-400">Error</h1>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Chat Test - Room: TEST</h1>

                <div className="mb-4 p-2 bg-gray-800 rounded">
                    <p className="text-sm">User ID: {user?.uid}</p>
                    <p className="text-sm">Auth: {auth ? '✓' : '✗'}</p>
                    <p className="text-sm">RTDB: {rtdb ? '✓' : '✗'}</p>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto mb-4">
                    {messages.length === 0 ? (
                        <p className="text-gray-400 text-center">No messages yet. Send the first one!</p>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className="mb-2 p-2 bg-gray-800 rounded">
                                <div className="text-xs text-gray-400 mb-1">
                                    {msg.username} • {new Date(msg.createdAt).toLocaleTimeString()}
                                </div>
                                <div>{msg.text}</div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-white focus:outline-none"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <a href="/" className="text-blue-400 hover:text-blue-300">
                        ← Back to Home
                    </a>
                </div>
            </div>
        </div>
    );
}
