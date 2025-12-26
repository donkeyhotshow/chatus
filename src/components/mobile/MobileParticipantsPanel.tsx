"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Search,
    MoreVertical,
    UserPlus,
    Crown,
    Shield,
    VolumeX,
    MessageCircle,
    UserX
} from 'lucide-react';
import { SwipeGestures } from './SwipeGestures';
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

interface MobileParticipantsPanelProps {
    isVisible: boolean;
    onClose: () => void;
    users: User[];
    currentUserId: string;
    onUserAction?: (userId: string, action: 'message' | 'mute' | 'kick' | 'promote') => void;
    onInviteUsers?: () => void;
    className?: string;
}

export function MobileParticipantsPanel({
    isVisible,
    onClose,
    users,
    currentUserId,
    onUserAction,
    onInviteUsers,
    className
}: MobileParticipantsPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onlineUsers = filteredUsers.filter(user => user.isOnline);
    const offlineUsers = filteredUsers.filter(user => !user.isOnline);

    const currentUser = users.find(user => user.id === currentUserId);
    const isCurrentUserAdmin = currentUser?.role === 'admin';

    const formatLastSeen = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'только что';
        if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
        return `${Math.floor(diffInMinutes / 1440)} дн назад`;
    };

    const getRoleIcon = (role?: string) => {
        switch (role) {
            case 'admin':
                return <Crown className="w-4 h-4 text-yellow-400" />;
            case 'moderator':
                return <Shield className="w-4 h-4 text-blue-400" />;
            default:
                return null;
        }
    };

    const handleUserAction = (userId: string, action: 'message' | 'mute' | 'kick' | 'promote') => {
        onUserAction?.(userId, action);
        setSelectedUser(null);

        // Вибрация для обратной связи
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const UserItem = ({ user }: { user: User }) => (
        <SwipeGestures
            onSwipeLeft={() => setSelectedUser(user.id)}
            onSwipeRight={() => handleUserAction(user.id, 'message')}
            threshold={50}
        >
            <motion.div
                className={cn(
                    "flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                    selectedUser === user.id
                        ? "bg-violet-500/20 border border-violet-500/30"
                        : "hover:bg-white/5 active:bg-white/10"
                )}
                whileTap={{ scale: 0.98 }}
                onTap={() => {
                    if (selectedUser === user.id) {
                        setSelectedUser(null);
                    } else {
                        setSelectedUser(user.id);
                    }
                }}
            >
                {/* Аватар */}
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user.name.charAt(0).toUpperCase()
                        )}
                    </div>

                    {/* Статус онлайн */}
                    {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                    )}

                    {/* Индикатор печати */}
                    {user.isTyping && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                        >
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </motion.div>
                    )}
                </div>

                {/* Информация о пользователе */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">
                            {user.name}
                        </span>
                        {getRoleIcon(user.role)}
                        {user.isMuted && (
                            <VolumeX className="w-4 h-4 text-red-400" />
                        )}
                    </div>

                    <div className="text-xs text-neutral-400">
                        {user.isOnline ? (
                            user.isTyping ? 'печатает...' : 'онлайн'
                        ) : (
                            user.lastSeen ? formatLastSeen(user.lastSeen) : 'офлайн'
                        )}
                    </div>
                </div>

                {/* Кнопка действий */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(selectedUser === user.id ? null : user.id);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors touch-target"
                >
                    <MoreVertical className="w-5 h-5" />
                </button>
            </motion.div>
        </SwipeGestures>
    );

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cn(
                            "fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-neutral-900 border-l border-white/10 z-50 flex flex-col",
                            className
                        )}
                    >
                        {/* Заголовок */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div>
                                <h2 className="text-lg font-bold text-white">Участники</h2>
                                <p className="text-sm text-neutral-400">
                                    {onlineUsers.length} онлайн • {users.length} всего
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-neutral-400 hot-white hover:bg-white/10 transition-colors touch-target"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Поиск */}
                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Поиск участников..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-600 rounded-xl text-white placeholder-neutral-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Кнопка приглашения */}
                        {onInviteUsers && (
                            <div className="p-4 border-b border-white/10">
                                <button
                                    onClick={onInviteUsers}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all duration-200 touch-target"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Пригласить участников
                                </button>
                            </div>
                        )}

                        {/* Список участников */}
                        <div className="flex-1 overflow-y-auto mobile-scroll-y participants-panel">
                            {/* Онлайн пользователи */}
                            {onlineUsers.length > 0 && (
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wide">
                                        Онлайн ({onlineUsers.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {onlineUsers.map((user) => (
                                            <UserItem key={user.id} user={user} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Офлайн пользователи */}
                            {offlineUsers.length > 0 && (
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wide">
                                        Офлайн ({offlineUsers.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {offlineUsers.map((user) => (
                                            <UserItem key={user.id} user={user} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Пустое состояние */}
                            {filteredUsers.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 px-4">
                                    <Search className="w-12 h-12 text-neutral-600 mb-4" />
                                    <p className="text-neutral-400 text-center">
                                        {searchQuery ? 'Участники не найдены' : 'Нет участников'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Контекстное меню для выбранного пользователя */}
                        <AnimatePresence>
                            {selectedUser && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="border-t border-white/10 bg-neutral-800/50 backdrop-blur-sm"
                                >
                                    <div className="p-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleUserAction(selectedUser, 'message')}
                                                className="flex items-center justify-center gap-2 py-3 bg-neutral-700 text-white rounded-xl hover:bg-neutral-600 transition-colors touch-target"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Написать
                                            </button>

                                            {isCurrentUserAdmin && selectedUser !== currentUserId && (
                                                <>
                                                    <button
                                                        onClick={() => handleUserAction(selectedUser, 'mute')}
                                                        className="flex items-center justify-center gap-2 py-3 bg-neutral-700 text-white rounded-xl hover:bg-neutral-600 transition-colors touch-target"
                                                    >
                                                        <VolumeX className="w-4 h-4" />
                                                        Заглушить
                                                    </button>

                                                    <button
                                                        onClick={() => handleUserAction(selectedUser, 'promote')}
                                                        className="flex items-center justify-center gap-2 py-3 bg-neutral-700 text-white rounded-xl hover:bg-neutral-600 transition-colors touch-target"
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                        Модератор
                                                    </button>

                                                    <button
                                                        onClick={() => handleUserAction(selectedUser, 'kick')}
                                                        className="flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors touch-target"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                        Исключить
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
