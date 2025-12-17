"use client";

import React, { useState, useMemo } from 'react';
import { Search, Gpad2, Sparkles, Crown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GameCard,
    EnhancedMessageSearch,
    EnhancedTypingIndicator
} from '@/components/enhanced';
import MessageItem from '@/components/chat/MessageItem';
import { Message, UserProfile } from '@/lib/types';

// Premium mock data
const premiumUsers: UserProfile[] = [
    { id: '1', name: 'CyberElite', avatar: '/avatars/elite.jpg' },
    { id: '2', name: 'NeonMaster', avatar: '/avatars/master.jpg' },
    { id: '3', name: 'QuantumPro', avatar: '/avatars/pro.jpg' },
];

const premiumMessages: Message[] = [
    {
        id: '1',
        text: 'Добро пожаловать в премиальный чат! 🚀',
        user: premiumUsers[0],
        createdAt: { toDate: () => new Date(Date.now() - 300000) } as any,
        type: 'text'
    },
    {
        id: '2',
        text: 'Невероятные визуальные эффекты! ✨',
        user: premiumUsers[1],
        createdAt: { toDate: () => new Date(Date.now() - 240000) } as any,
        type: 'text'
    },
    {
        id: '3',
        text: 'Это будущее чат-интерфейсов! 🔮',
        user: premiumUsers[2],
        createdAt: { toDate: () => new Date(Date.now() - 180000) } as any,
        type: 'text'
    }
];

const premiumReactions = [
    { emoji: '🚀', count: 5, users: ['CyberElite', 'NeonMaster', 'QuantumPro'] },
    { emoji: '✨', count: 3, users: ['CyberElite', 'NeonMaster'] },
    { emoji: '🔥', count: 2, users: ['QuantumPro', 'CyberElite'] }
];

export function PremiumChatShowcase() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [typingUsers, setTypingUsers] = useState<UserProfile[]>([premiumUsers[1]]);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [activeDemo, setActiveDemo] = useState<'chat' | 'games' | 'search'>('chat');

    const premiumGames = useMemo(() => [
        {
            id: 'neural-chess',
            title: 'Neural Chess',
            description: 'AI-powered chess with quantum mechanics',
            icon: <Crown className="w-7 h-7" />
        },
        {
            id: 'cyber-racing',
            title: 'Cyber Racing',
            description: 'High-speed racing in virtual reality',
            icon: <Zap className="w-7 h-7" />
        },
        {
            id: 'quantum-puzzle',
            title: 'Quantum Puzzle',
            description: 'Mind-bending puzzles across dimensions',
            icon: <Sparkles className="w-7 h-7" />
        }
    ], []);

    const handleReaction = (messageId: string, emoji: string) => {
        console.log(`Premium reaction ${emoji} added to message ${messageId}`);
    };

    const handleDelete = (messageId: string) => {
        console.log(`Delete premium message ${messageId}`);
    };

    const handleImageClick = (imageUrl: string) => {
        console.log(`Open premium image ${imageUrl}`);
    };

    const handleReply = (message: Message) => {
        console.log(`Reply to premium message`, message);
    };

    const handleGameStart = (gameId: string) => {
        setSelectedGame(gameId);
        console.log(`Starting premium game: ${gameId}`);
    };

    const handleMessageSelect = (messageId: string) => {
        console.log(`Navigate to premium message: ${messageId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-8 space-y-8">

                {/* Premium Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4 tracking-tight">
                        Premium Chat Experience
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Откройте для себя будущее общения с премиальными компонентами и невероятными визуальными эффектами
                    </p>
                    <div className="mt-6 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full max-w-md mx-auto"></div>
                </motion.div>

                {/* Navigation */}
                <motion.div
                    className="flex justify-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <div className="flex gap-2 p-2 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-cyan-500/30">
                        {[
                            { key: 'chat', label: 'Чат', icon: '💬' },
                            { key: 'games', label: 'Игры', icon: '🎮' },
                            { key: 'search', label: 'Поиск', icon: '🔍' }
                        ].map(({ key, label, icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveDemo(key as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${activeDemo === key
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/25'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                <span className="text-lg">{icon}</span>
                                <span className="font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Demo Content */}
                <AnimatePresence mode="wait">
                    {activeDemo === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            {/* Chat Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                        Premium Messages
                                    </h2>
                                    <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
                                </div>

                                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-3xl p-6 border border-cyan-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                                    {premiumMessages.map((message, index) => (
                                        <MessageItem
                                            key={message.id}
                                            message={message}
                                            isOwn={index % 2 === 0}
                                            onReaction={handleReaction}
                                            onDelete={handleDelete}
                                            onImageClick={handleImageClick}
                                            onReply={handleReply}
                                            reactions={index === 0 ? premiumReactions : []}
                                        />
                                    ))}

                                    <EnhancedTypingIndicator typingUsers={typingUsers} />
                                </div>

                                {/* Controls */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsSearchOpen(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105"
                                    >
                                        <Search className="w-5 h-5" />
                                        Открыть поиск
                                    </button>

                                    <button
                                        onClick={() => setTypingUsers(prev =>
                                            prev.length > 0 ? [] : [premiumUsers[1], premiumUsers[2]]
                                        )}
                                        className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-600 transition-all duration-300 border border-slate-600/50 hover:border-cyan-400/50"
                                    >
                                        {typingUsers.length > 0 ? 'Скрыть набор' : 'Показать набор'}
                                    </button>
                                </div>
                            </div>

                            {/* Features Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                                        Premium Features
                                    </h2>
                                    <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                                </div>

                                <div className="grid gap-4">
                                    {[
                                        {
                                            title: 'Анимированные реакции',
                                            description: 'Интерактивные эмодзи с плавными анимациями',
                                            icon: '😊',
                                            gradient: 'from-yellow-400 to-orange-500'
                                        },
                                        {
                                            title: 'Умный поиск',
                                            description: 'Расширенный поиск с фильтрами и релевантностью',
                                            icon: '🔍',
                                            gradient: 'from-cyan-400 to-blue-500'
                                        },
                                        {
                                            title: 'Живые индикаторы',
                                            description: 'Красивые анимации набора текста',
                                            icon: '✨',
                                            gradient: 'from-purple-400 to-pink-500'
                                        },
                                        {
                                            title: 'Премиум дизайн',
                                            description: 'Современные градиенты и эффекты',
                                            icon: '🎨',
                                            gradient: 'from-green-400 to-emerald-500'
                                        }
                                    ].map((feature, index) => (
                                        <motion.div
                                            key={feature.title}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-6 bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    {feature.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                                                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeDemo === 'games' && (
                        <motion.div
                            key="games"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
                                    Premium Games
                                </h2>
                                <p className="text-slate-300">Откройте для себя игры будущего с невероятной графикой</p>
                            </div>

                            <div className="grid gap-6 max-w-2xl mx-auto">
                                {premiumGames.map((game, index) => (
                                    <motion.div
                                        key={game.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <GameCard
                                            id={game.id}
                                            title={game.title}
                                            description={game.description}
                                            icon={game.icon}
                                            isLoading={selectedGame === game.id}
                                            onClick={() => handleGameStart(game.id)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeDemo === 'search' && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-8">
                                Расширенный поиск
                            </h2>
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black rounded-2xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 text-lg font-semibold"
                            >
                                <Search className="w-6 h-6" />
                                Открыть премиум поиск
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Enhanced Message Search */}
                <EnhancedMessageSearch
                    messages={premiumMessages}
                    users={premiumUsers}
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onMessageSelect={handleMessageSelect}
                />
            </div>
        </div>
    );
}
