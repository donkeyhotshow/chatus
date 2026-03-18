"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileProfileCreation } from './MobileProfileCreation';
import { MobileChatInterface } from './MobileChatInterface';
import { MobileParticipantsPanel } from './MobileParticipantsPanel';
import { MobileSettingsPanel } from './MobileSettingsPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface User {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
    role?: 'admin' | 'moderator' | 'member';
    lastSeen?: Date;
    isMuted?: boolean;
    isTyping?: boolean;
}

interface Message {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    timestamp: Date;
    isOwn: boolean;
}

interface Settings {
    notifications: boolean;
    sounds: boolean;
    vibration: boolean;
    darkMode: boolean;
    language: string;
    theme: string;
    privacy: {
        showOnlineStatus: boolean;
        showLastSeen: boolean;
    };
}

interface MobileAppProps {
    onDesktopFallback?: () => void;
}

export function MobileApp({ onDesktopFallback }: MobileAppProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        notifications: true,
        sounds: true,
        vibration: true,
        darkMode: true,
        language: 'ru',
        theme: 'cyberpunk',
        privacy: {
            showOnlineStatus: true,
            showLastSeen: true
        }
    });

    const isMobile = useIsMobile();

    // Если не мобильное устройство, показываем fallback
    useEffect(() => {
        if (!isMobile && onDesktopFallback) {
            onDesktopFallback();
        }
    }, [isMobile, onDesktopFallback]);

    // Инициализация пользователей (mock data)
    useEffect(() => {
        const mockUsers: User[] = [
            {
                id: '1',
                name: 'Алексей',
                isOnline: true,
                role: 'admin',
                isTyping: false
            },
            {
                id: '2',
                name: 'Мария',
                isOnline: true,
                role: 'moderator',
                isTyping: true
            },
            {
                id: '3',
                name: 'Дмитрий',
                isOnline: false,
                role: 'member',
                lastSeen: new Date(Date.now() - 1000 * 60 * 30) // 30 минут назад
            },
            {
                id: '4',
                name: 'Елена',
                isOnline: true,
                role: 'member'
            }
        ];

        setUsers(mockUsers);
    }, []);

    // Инициализация сообщений (mock data)
    useEffect(() => {
        const mockMessages: Message[] = [
            {
                id: '1',
                text: 'Привет всем! Как дела?',
                userId: '1',
                userName: 'Алексей',
                timestamp: new Date(Date.now() - 1000 * 60 * 10),
                isOwn: false
            },
            {
                id: '2',
                text: 'Привет! Всё отлично, спасибо!',
                userId: '2',
                userName: 'Мария',
                timestamp: new Date(Date.now() - 1000 * 60 * 8),
                isOwn: false
            },
            {
                id: '3',
                text: 'Рад всех видеть в нашем чате!',
                userId: 'current',
                userName: 'Вы',
                timestamp: new Date(Date.now() - 1000 * 60 * 5),
                isOwn: true
            }
        ];

        setMessages(mockMessages);
    }, []);

    const handleProfileComplete = (profile: { avatar: string; name: string }) => {
        const newUser: User = {
            id: 'current',
            name: profile.name,
            avatar: profile.avatar,
            isOnline: true,
            role: 'member'
        };

        setCurrentUser(newUser);
        setUsers(prev => [...prev, newUser]);
    };

    const handleSendMessage = (text: string) => {
        if (!currentUser) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            timestamp: new Date(),
            isOwn: true
        };

        setMessages(prev => [...prev, newMessage]);

        // Имитация ответа от другого пользователя
        setTimeout(() => {
            const responses = [
                'Интересно!',
                'Согласен с тобой',
                'А что думаете остальные?',
                'Хорошая мысль!',
                'Давайте обсудим это подробнее'
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            const randomUser = users[Math.floor(Math.random() * users.length)];

            if (randomUser && randomUser.id !== 'current') {
                const responseMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: randomResponse,
                    userId: randomUser.id,
                    userName: randomUser.name,
                    userAvatar: randomUser.avatar,
                    timestamp: new Date(),
                    isOwn: false
                };

                setMessages(prev => [...prev, responseMessage]);
            }
        }, 1000 + Math.random() * 2000);
    };

    const handleUserAction = (userId: string, action: 'message' | 'mute' | 'kick' | 'promote') => {
        if (process.env.NODE_ENV === 'development') console.log(`Action ${action} for user ${userId}`);

        switch (action) {
            case 'mute':
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, isMuted: !user.isMuted } : user
                ));
                break;
            case 'kick':
                setUsers(prev => prev.filter(user => user.id !== userId));
                break;
            case 'promote':
                setUsers(prev => prev.map(user =>
                    user.id === userId
                        ? { ...user, role: user.role === 'moderator' ? 'member' : 'moderator' as const }
                        : user
                ));
                break;
            case 'message':
                // Здесь можно открыть личный чат
                if (process.env.NODE_ENV === 'development') console.log('Opening private chat with user', userId);
                break;
        }
    };

    const handleSettingChange = (key: string, value: any) => {
        if (key.includes('.')) {
            const [parentKey, childKey] = key.split('.');
            setSettings(prev => ({
                ...prev,
                [parentKey]: {
                    ...(prev[parentKey as keyof Settings] as any),
                    [childKey]: value
                }
            }));
        } else {
            setSettings(prev => ({
                ...prev,
                [key]: value
            }));
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setUsers(prev => prev.filter(user => user.id !== 'current'));
        setMessages([]);
    };

    const handleExportData = () => {
        const data = {
            user: currentUser,
            messages: messages.filter(m => m.isOwn),
            settings
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-data.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClearData = () => {
        if (confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
    };

    // Если не мобильное устройство, не рендерим компонент
    if (!isMobile) {
        return null;
    }

    // Если пользователь не создал профиль, показываем экран создания профиля
    if (!currentUser) {
        return (
            <div className="h-screen bg-black">
                <MobileProfileCreation
                    onComplete={handleProfileComplete}
                />
            </div>
        );
    }

    return (
        <div className={cn(
            "h-screen bg-black relative overflow-hidden",
            settings.theme === 'cyberpunk' && "bg-gradient-to-br from-black via-neutral-900 to-black",
            settings.theme === 'neon' && "bg-gradient-to-br from-purple-900 via-black to-pink-900",
            settings.theme === 'matrix' && "bg-gradient-to-br from-green-900 via-black to-green-800",
            settings.theme === 'sunset' && "bg-gradient-to-br from-orange-900 via-black to-red-900",
            settings.theme === 'ocean' && "bg-gradient-to-br from-blue-900 via-black to-cyan-900"
        )}>
            {/* Основной чат */}
            <MobileChatInterface
                roomName="Комната 1"
                currentUser={currentUser}
                users={users}
                messages={messages}
                onBack={handleLogout}
                onSendMessage={handleSendMessage}
                onDeleteMessage={(messageId) => {
                    setMessages(prev => prev.filter(m => m.id !== messageId));
                }}
                onReplyToMessage={(messageId) => {
                    const message = messages.find(m => m.id === messageId);
                    if (message) {
                        if (process.env.NODE_ENV === 'development') console.log('Replying to message:', message.text);
                    }
                }}
                onForwardMessage={(messageId) => {
                    const message = messages.find(m => m.id === messageId);
                    if (message) {
                        if (process.env.NODE_ENV === 'development') console.log('Forwarding message:', message.text);
                    }
                }}
            />

            {/* Панель участников */}
            <MobileParticipantsPanel
                isVisible={showParticipants}
                onClose={() => setShowParticipants(false)}
                users={users}
                currentUserId={currentUser.id}
                onUserAction={handleUserAction}
                onInviteUsers={() => {
                    if (process.env.NODE_ENV === 'development') console.log('Inviting users...');
                }}
            />

            {/* Панель настроек */}
            <MobileSettingsPanel
                isVisible={showSettings}
                onClose={() => setShowSettings(false)}
                settings={settings}
                onSettingChange={handleSettingChange}
                onLogout={handleLogout}
                onExportData={handleExportData}
                onClearData={handleClearData}
            />

            {/* Кнопки для открытия панелей (временные, для демонстрации) */}
            <div className="fixed top-4 right-4 flex gap-2 z-30">
                <button
                    onClick={() => setShowParticipants(true)}
                    className="w-12 h-12 bg-violet-500 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                    👥
                </button>
                <button
                    onClick={() => setShowSettings(true)}
                    className="w-12 h-12 bg-neutral-700 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                    ⚙️
                </button>
            </div>

            {/* Эффекты темы */}
            <AnimatePresence>
                {settings.theme === 'cyberpunk' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle at 20% 80%, cyan 0%, transparent 50%), radial-gradient(circle at 80% 20%, magenta 0%, transparent 50%)'
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
