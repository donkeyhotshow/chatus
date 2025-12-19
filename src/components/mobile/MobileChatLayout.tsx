"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Menu } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { ChatArea } from '../chat/ChatArea';
import { CollaborationSpace } from '../chat/CollaborationSpace';
import { MobileNavigation, MobileTab } from './MobileNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileChatLayoutProps {
    user: UserProfile;
    roomId: string;
    otherUser?: UserProfile;
    allUsers: UserProfile[];
    onBack?: () => void;
}

export function MobileChatLayout({
    user,
    roomId,
    otherUser,
    allUsers,
    onBack
}: MobileChatLayoutProps) {
    const [activeTab, setActiveTab] = useState<MobileTab>('chat');
    const [isCollabSpaceVisible, setIsCollabSpaceVisible] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const isMobile = useIsMobile();

    // Keyboard detection for mobile
    useEffect(() => {
        if (!isMobile) return;

        const handleResize = () => {
            const viewportHeight = window.visualViewport?.height || window.innerHeight;
            const windowHeight = window.innerHeight;
            const keyboardHeight = windowHeight - viewportHeight;

            setKeyboardVisible(keyboardHeight > 150);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            return () => window.visualViewport?.removeEventListener('resize', handleResize);
        } else {
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [isMobile]);

    const handleTabChange = useCallback((tab: MobileTab) => {
        if (tab === 'more') return; // Handle 'more' separately
        setActiveTab(tab);

        if (tab === 'chat') {
            setIsCollabSpaceVisible(false);
        } else {
            setIsCollabSpaceVisible(true);
        }
    }, []);

    const handleToggleCollabSpace = useCallback(() => {
        setIsCollabSpaceVisible(prev => !prev);
        if (!isCollabSpaceVisible) {
            // Если открываем, переключаемся на соответствующую вкладку
            if (activeTab === 'chat') {
                setActiveTab('games');
            }
        } else {
            // Если закрываем, возвращаемся к чату
            setActiveTab('chat');
        }
    }, [isCollabSpaceVisible, activeTab]);

    const handleMobileBack = useCallback(() => {
        if (isCollabSpaceVisible) {
            // Если открыта боковая панель, сначала закрываем её
            setIsCollabSpaceVisible(false);
            setActiveTab('chat');
        } else if (onBack) {
            // Иначе выходим из чата
            onBack();
        }
    }, [isCollabSpaceVisible, onBack]);

    if (!isMobile) {
        // На десктопе используем обычный layout
        return (
            <div className="flex h-full">
                <div className="flex-1">
                    <ChatArea
                        user={user}
                        roomId={roomId}
                        isCollabSpaceVisible={isCollabSpaceVisible}
                        onToggleCollaborationSpace={handleToggleCollabSpace}
                        onMobileBack={handleMobileBack}
                    />
                </div>
                {isCollabSpaceVisible && (
                    <div className="w-96">
                        <CollaborationSpace
                            isVisible={isCollabSpaceVisible}
                            roomId={roomId}
                            user={user}
                            otherUser={otherUser}
                            allUsers={allUsers}
                            mobileActiveTab={activeTab === 'more' ? 'chat' : activeTab}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black relative overflow-hidden">
            {/* Mobile Header */}
            <motion.header
                className="flex items-center justify-between p-4 bg-black/95 backdrop-blur-sm border-b border-white/10 z-50"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <button
                    onClick={handleMobileBack}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors touch-target"
                    aria-label="Назад"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="flex-1 text-center">
                    <h1 className="text-lg font-bold text-white truncate">
                        {activeTab === 'chat'
                            ? (otherUser?.name || `Комната ${roomId}`)
                            : activeTab === 'games'
                                ? 'Игры'
                                : activeTab === 'canvas'
                                    ? 'Холст'
                                    : 'Участники'
                        }
                    </h1>
                    {activeTab === 'chat' && allUsers.length > 0 && (
                        <p className="text-xs text-neutral-400">
                            {allUsers.length} участник{allUsers.length > 1 ? 'а' : ''}
                        </p>
                    )}
                </div>

                <button
                    onClick={() => setIsCollabSpaceVisible(!isCollabSpaceVisible)}
                    className={cn(
                        "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors touch-target",
                        isCollabSpaceVisible
                            ? "text-cyan-400 bg-cyan-400/20"
                            : "text-white hover:bg-white/10"
                    )}
                    aria-label={isCollabSpaceVisible ? "Закрыть меню" : "Открыть меню"}
                >
                    {isCollabSpaceVisible ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </motion.header>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Chat Area */}
                <motion.div
                    className={cn(
                        "absolute inset-0 bg-black",
                        activeTab === 'chat' ? 'z-20' : 'z-10'
                    )}
                    animate={{
                        x: activeTab === 'chat' ? 0 : '-100%',
                        opacity: activeTab === 'chat' ? 1 : 0.3
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <ChatArea
                        user={user}
                        roomId={roomId}
                        isCollabSpaceVisible={false} // На мобильных всегда false для ChatArea
                        onToggleCollaborationSpace={handleToggleCollabSpace}
                        onMobileBack={handleMobileBack}
                    />
                </motion.div>

                {/* Collaboration Space Overlay */}
                <AnimatePresence>
                    {isCollabSpaceVisible && (
                        <motion.div
                            className="absolute inset-0 z-30 bg-black"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <CollaborationSpace
                                isVisible={true}
                                roomId={roomId}
                                user={user}
                                otherUser={otherUser}
                                allUsers={allUsers}
                                mobileActiveTab={activeTab === 'more' ? 'chat' : activeTab}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Backdrop for collaboration space */}
                <AnimatePresence>
                    {isCollabSpaceVisible && (
                        <motion.div
                            className="absolute inset-0 bg-black/50 z-25"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCollabSpaceVisible(false)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Navigation */}
            <MobileNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isCollabSpaceVisible={isCollabSpaceVisible}
                onToggleCollabSpace={handleToggleCollabSpace}
                unreadCount={0} // TODO: Implement unread count

            />

            {/* Keyboard spacer */}
            {keyboardVisible && (
                <div
                    className="flex-shrink-0 bg-black transition-all duration-300"
                    style={{ height: 'env(keyboard-inset-height, 0px)' }}
                />
            )}
        </div>
    );
}
