"use client";

import { useState, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Menu } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { ChatArea } from '../chat/ChatArea';
import { MobileNavigation, MobileTab } from './MobileNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

// Lazy load heavy CollaborationSpace component (Requirements: 16.3)
const CollaborationSpace = lazy(() =>
  import('../chat/CollaborationSpace').then(m => ({ default: m.CollaborationSpace }))
);

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
    const isMobile = useIsMobile();

    // Keyboard detection removed - handled by CSS safe-area

    const handleTabChange = useCallback((tab: MobileTab) => {
        if (tab === 'more') return;
        setActiveTab(tab);

        if (tab === 'chat') {
            setIsCollabSpaceVisible(false);
        } else {
            setIsCollabSpaceVisible(true);
        }
    }, []);

    const handleMobileBack = useCallback(() => {
        if (isCollabSpaceVisible) {
            setIsCollabSpaceVisible(false);
            setActiveTab('chat');
        } else if (onBack) {
            onBack();
        }
    }, [isCollabSpaceVisible, onBack]);

    if (!isMobile) {
        return (
            <div className="flex h-full">
                <div className="flex-1">
                    <ChatArea
                        user={user}
                        roomId={roomId}
                        onMobileBack={handleMobileBack}
                    />
                </div>
                {isCollabSpaceVisible && (
                    <div className="w-96">
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center space-y-3">
                                    <LoadingSpinner size="lg" />
                                    <p className="text-sm text-neutral-400">Загрузка...</p>
                                </div>
                            </div>
                        }>
                            <CollaborationSpace
                                isVisible={isCollabSpaceVisible}
                                roomId={roomId}
                                user={user}
                                otherUser={otherUser}
                                allUsers={allUsers}
                                mobileActiveTab={activeTab === 'more' ? 'chat' : activeTab}
                            />
                        </Suspense>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black relative overflow-hidden">
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
                            ? "text-violet-400 bg-violet-400/20"
                            : "text-white hover:bg-white/10"
                    )}
                    aria-label={isCollabSpaceVisible ? "Закрыть меню" : "Открыть меню"}
                >
                    {isCollabSpaceVisible ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </motion.header>

            {/* Main content with bottom padding for navigation */}
            <div className="flex-1 relative overflow-hidden pb-[calc(72px+env(safe-area-inset-bottom,0px))]">
                <motion.div
                    className={cn(
                        "absolute inset-0 bg-black overflow-y-auto mobile-scroll-y",
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
                        onMobileBack={handleMobileBack}
                    />
                </motion.div>

                <AnimatePresence>
                    {isCollabSpaceVisible && (
                        <motion.div
                            className="absolute inset-0 z-30 bg-black overflow-y-auto mobile-scroll-y"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <Suspense fallback={
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center space-y-3">
                                        <LoadingSpinner size="lg" />
                                        <p className="text-sm text-neutral-400">Загрузка...</p>
                                    </div>
                                </div>
                            }>
                                <CollaborationSpace
                                    isVisible={true}
                                    roomId={roomId}
                                    user={user}
                                    otherUser={otherUser}
                                    allUsers={allUsers}
                                    mobileActiveTab={activeTab === 'more' ? 'chat' : activeTab}
                                />
                            </Suspense>
                        </motion.div>
                    )}
                </AnimatePresence>

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

            <MobileNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                unreadCount={0}
            />
        </div>
    );
}
