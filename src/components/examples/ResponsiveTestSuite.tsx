"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Tablet, Monitor, Gamepad2 } from 'lucide-react';
import {
    GameCard,
    EnhancedMessageSearch,
    EnhancedTypingIndicator
} from '@/components/enhanced';
import MessageItem from '@/components/chat/MessageItem';
import { Message, UserProfile } from '@/lib/types';
import { useMediaQuery } from '@/hooks/use-media-query';

// Test data
const testUsers: UserProfile[] = [
    { id: '1', name: 'Testr1', avatar: '/avatars/user1.jpg' },
    { id: '2', name: 'TestUser2', avatar: '/avatars/user2.jpg' },
];

const testMessages: Message[] = [
    {
        id: '1',
        text: 'Тестовое сообщение для проверки адаптивности на разных устройствах',
        user: testUsers[0],
        createdAt: { toDate: () => new Date() } as any,
        type: 'text'
    },
    {
        id: '2',
        text: 'Короткое сообщение',
        user: testUsers[1],
        createdAt: { toDate: () => new Date() } as any,
        type: 'text'
    }
];

const testReactions = [
    { emoji: '👍', count: 5, users: ['User1', 'User2', 'User3'] },
    { emoji: '❤️', count: 2, users: ['User1', 'User2'] }
];

export function ResponsiveTestSuite() {
    const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Реальные медиа-запросы
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
    const isDesktop = useMediaQuery('(min-width: 1025px)');
    const isTouchDevice = useMediaQuery('(hover: none)');

    const devices = [
        { key: 'mobile', label: 'Mobile', icon: Smartphone, width: '375px' },
        { key: 'tablet', label: 'Tablet', icon: Tablet, width: '768px' },
        { key: 'desktop', label: 'Desktop', icon: Monitor, width: '1200px' }
    ];

    const handleReaction = (messageId: string, emoji: string) => {
        console.log(`Reaction test: ${emoji} on ${messageId}`);
    };

    const handleDelete = (messageId: string) => {
        console.log(`Delete test: ${messageId}`);
    };

    const handleImageClick = (imageUrl: string) => {
        console.log(`Image test: ${imageUrl}`);
    };

    const handleReply = (message: Message) => {
        console.log(`Reply test:`, message);
    };

    const handleGameStart = (gameId: string) => {
        console.log(`Game test: ${gameId}`);
    };

    const handleMessageSelect = (messageId: string) => {
        console.log(`Search test: ${messageId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white p-4">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
                        Responsive Test Suite
                    </h1>
                    <p className="text-slate-300 mb-6">
                        Тестирование адаптивности компонентов на разных устройствах
                    </p>

                    {/* Device Info */}
                    <div className="flex justify-center gap-4 mb-6">
                        <div className={`px-4 py-2 rounded-lg ${isMobile ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                            📱 Mobile: {isMobile ? 'Active' : 'Inactive'}
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${isTablet ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                            📟 Tablet: {isTablet ? 'Active' : 'Inactive'}
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${isDesktop ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                            🖥️ Desktop: {isDesktop ? 'Active' : 'Inactive'}
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${isTouchDevice ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                            👆 Touch: {isTouchDevice ? 'Yes' : 'No'}
                        </div>
                    </div>
                </div>

                {/* Device Simulator */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-center">Device Simulator</h2>

                    {/* Device Selector */}
                    <div className="flex justify-center gap-2 mb-6">
                        {devices.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setSelectedDevice(key as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${selectedDevice === key
                                        ? 'bg-cyan-500 text-black'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Simulated Device Frame */}
                    <div className="flex justify-center">
                        <div
                            className="bg-slate-900 border-4 border-slate-700 rounded-3xl p-4 transition-all duration-500"
                            style={{
                                width: devices.find(d => d.key === selectedDevice)?.width,
                                maxWidth: '100%'
                            }}
                        >
                            <div className="bg-slate-950 rounded-2xl p-4 h-96 overflow-y-auto">
                                {/* Test Components in Simulated Device */}
                                <div className="space-y-4">
                                    <MessageItem
                                        message={testMessages[0]}
                                        isOwn={false}
                                        onReaction={handleReaction}
                                        onDelete={handleDelete}
                                        onImageClick={handleImageClick}
                                        onReply={handleReply}
                                        reactions={testReactions}
                                    />

                                    <MessageItem
                                        message={testMessages[1]}
                                        isOwn={true}
                                        onReaction={handleReaction}
                                        onDelete={handleDelete}
                                        onImageClick={handleImageClick}
                                        onReply={handleReply}
                                    />

                                    <EnhancedTypingIndicator typingUsers={[testUsers[0]]} />

                                    <GameCard
                                        id="test-game"
                                        title="Test Game"
                                        description="Testing responsive game card component"
                                        icon={<Gamepad2 className="w-6 h-6" />}
                                        onClick={() => handleGameStart('test-game')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real Device Tests */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* MessageItem Tests */}
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-xl font-semibold mb-4 text-cyan-400">MessageItem Tests</h3>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-2">Сообщение с реакциями:</h4>
                                <MessageItem
                                    message={testMessages[0]}
                                    isOwn={false}
                                    onReaction={handleReaction}
                                    onDelete={handleDelete}
                                    onImageClick={handleImageClick}
                                    onReply={handleReply}
                                    reactions={testReactions}
                                />
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-2">Собственное сообщение:</h4>
                                <MessageItem
                                    message={testMessages[1]}
                                    isOwn={true}
                                    onReaction={handleReaction}
                                    onDelete={handleDelete}
                                    onImageClick={handleImageClick}
                                    onReply={handleReply}
                                />
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-2">Индикатор набора:</h4>
                                <EnhancedTypingIndicator typingUsers={testUsers} />
                            </div>
                        </div>
                    </div>

                    {/* GameCard Tests */}
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-xl font-semibold mb-4 text-purple-400">GameCard Tests</h3>

                        <div className="space-y-4">
                            <GameCard
                                id="test-game-1"
                                title="Normal Game"
                                description="Standard game card for testing"
                                icon={<Gamepad2 className="w-6 h-6" />}
                                onClick={() => handleGameStart('test-game-1')}
                            />

                            <GameCard
                                id="test-game-2"
                                title="Loading Game"
                                description="Game card with loading state"
                                icon={<Gamepad2 className="w-6 h-6" />}
                                isLoading={true}
                                onClick={() => handleGameStart('test-game-2')}
                            />

                            <GameCard
                                id="test-game-3"
                                title="Very Long Game Title That Should Wrap"
                                description="This is a very long description that should test how the component handles overflow and text wrapping on different screen sizes"
                                icon={<Gamepad2 className="w-6 h-6" />}
                                onClick={() => handleGameStart('test-game-3')}
                            />
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="mt-8 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="text-xl font-semibold mb-4 text-green-400">Performance Metrics</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-300">60fps</div>
                            <div className="text-sm text-slate-400">Target FPS</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-300">44px</div>
                            <div className="text-sm text-slate-400">Min Touch Target</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-300">3:1</div>
                            <div className="text-sm text-slate-400">Min Contrast</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-300">WCAG AA</div>
                            <div className="text-sm text-slate-400">Accessibility</div>
                        </div>
                    </div>
                </div>

                {/* Test Controls */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-lg"
                    >
                        Test Enhanced Search
                    </button>
                </div>

                {/* Enhanced Message Search Test */}
                <EnhancedMessageSearch
                    messages={testMessages}
                    users={testUsers}
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onMessageSelect={handleMessageSelect}
                />
            </div>
        </div>
    );
}
