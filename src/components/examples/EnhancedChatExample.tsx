"use client";

import React, { useState, useMemo } from 'react';
import { Search, Gamepad2 } from 'lucide-react';
import {
    GameCard,
    EnhancedMessageSearch,
    EnhancedTypingIndicator
} from '@/components/enhanced';
import MessageItem from '@/components/chat/MessageItem';
import { Message, UserProfile } from '@/lib/types';

// Mock data for demonstration
const mockUsers: UserProfile[] = [
    { id: '1', name: 'CyberNinja', avatar: '/avatars/ninja.jpg' },
    { id: '2', name: 'NeonHacker', avatar: '/avatars/hacker.jpg' },
    { id: '3', name: 'QuantumGamer', avatar: '/avatars/gamer.jpg' },
];

const mockMessages: Message[] = [
    {
        id: '1',
        text: 'Привет всем! Кто готов к игре?',
        user: mockUsers[0],
        createdAt: { toDate: () => new Date(Date.no00) } as any,
        type: 'text'
    },
    {
        id: '2',
        text: 'Давайте сыграем в крестики-нолики!',
        user: mockUsers[1],
        createdAt: { toDate: () => new Date(Date.now() - 240000) } as any,
        type: 'text'
    },
    {
        id: '3',
        text: 'Отличная идея! Я за.',
        user: mockUsers[2],
        createdAt: { toDate: () => new Date(Date.now() - 180000) } as any,
        type: 'text'
    }
];

const mockReactions = [
    { emoji: '👍', count: 2, users: ['CyberNinja', 'NeonHacker'] },
    { emoji: '🔥', count: 1, users: ['QuantumGamer'] }
];

export function EnhancedChatExample() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [typingUsers, setTypingUsers] = useState<UserProfile[]>([mockUsers[1]]);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);

    const games = useMemo(() => [
        {
            id: 'tic-tac-toe',
            title: 'Крестики-нолики',
            description: 'Классическая логическая игра',
            icon: <Gamepad2 className="w-6 h-6" />
        },
        {
            id: 'rock-paper-scissors',
            title: 'Камень-ножницы-бумага',
            description: 'Игра на удачу и стратегию',
            icon: <Gamepad2 className="w-6 h-6" />
        },
        {
            id: 'click-war',
            title: 'Война кликов',
            description: 'Кто быстрее нажимает',
            icon: <Gamepad2 className="w-6 h-6" />
        }
    ], []);

    const handleReaction = (messageId: string, emoji: string) => {
        console.log(`Reaction ${emoji} added to message ${messageId}`);
    };

    const handleDelete = (messageId: string) => {
        console.log(`Delete message ${messageId}`);
    };

    const handleImageClick = (imageUrl: string) => {
        console.log(`Open image ${imageUrl}`);
    };

    const handleReply = (message: Message) => {
        console.log(`Reply to message`, message);
    };

    const handleGameStart = (gameId: string) => {
        setSelectedGame(gameId);
        console.log(`Starting game: ${gameId}`);
    };

    const handleMessageSelect = (messageId: string) => {
        console.log(`Navigate to message: ${messageId}`);
    };

    return (
        <div className="min-h-screen bg-black text-white p-4">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                        Enhanced Chat Components Demo
                    </h1>
                    <p className="text-neutral-400">
                        Демонстрация покращених компонентів чату з кібerpunk тематикою
                    </p>
                </div>

                {/* Controls */}
                <div className="flex gap-4 justify-center mb-6">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        Открыть поиск
                    </button>

                    <button
                        onClick={() => setTypingUsers(prev =>
                            prev.length > 0 ? [] : [mockUsers[1], mockUsers[2]]
                        )}
                        className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                        {typingUsers.length > 0 ? 'Скрыть набор' : 'Показать набор'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Chat Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-cyan-400">Сообщения</h2>

                        {/* Messages */}
                        <div className="bg-neutral-900 rounded-lg p-4 space-y-4">
                            {mockMessages.map((message, index) => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    isOwn={index % 2 === 0}
                                    onReaction={handleReaction}
                                    onDelete={handleDelete}
                                    onImageClick={handleImageClick}
                                    onReply={handleReply}
                                    reactions={index === 0 ? mockReactions : []}
                                />
                            ))}

                            {/* Typing Indicator */}
                            <EnhancedTypingIndicator typingUsers={typingUsers} />
                        </div>
                    </div>

                    {/* Games Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-cyan-400">Игры</h2>

                        <div className="bg-neutral-900 rounded-lg p-4 space-y-3">
                            {games.map((game) => (
                                <GameCard
                                    key={game.id}
                                    id={game.id}
                                    title={game.title}
                                    description={game.description}
                                    icon={game.icon}
                                    isLoading={selectedGame === game.id}
                                    onClick={() => handleGameStart(game.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features List */}
                <div className="bg-neutral-900 rounded-lg p-6 mt-8">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-4">Особенности компонентов</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-medium text-white">GameCard</h4>
                            <ul className="text-neutral-400 space-y-1">
                                <li>• Анимации при наведении</li>
                                <li>• Индикатор загрузки</li>
                                <li>• Responsive дизайн</li>
                                <li>• Accessibility</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-white">Enhanced Search</h4>
                            <ul className="text-neutral-400 space-y-1">
                                <li>• Фильтры по типу</li>
                                <li>• Поиск по дате</li>
                                <li>• Релевантность</li>
                                <li>• Клавиатурная навигация</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium text-white">Typing Indicator</h4>
                            <ul className="text-neutral-400 space-y-1">
                                <li>• Анимированные аватары</li>
                                <li>• Эффект пульсации</li>
                                <li>• Множественные пользователи</li>
                                <li>• Плавные переходы</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Enhanced Message Search */}
                <EnhancedMessageSearch
                    messages={mockMessages}
                    users={mockUsers}
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onMessageSelect={handleMessageSelect}
                />
            </div>
        </div>
    );
}
