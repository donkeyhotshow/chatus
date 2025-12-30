"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewMessageNotificationProps {
    hasNewMessages: boolean;
    onScrollToBottom: () => void;
    newMessageCount?: number;
}

export function NewMessageNotification({
    hasNewMessages,
    onScrollToBottom,
    newMessageCount = 0
}: NewMessageNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (hasNewMessages && newMessageCount > 0) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [hasNewMessages, newMessageCount]);

    const handleClick = () => {
        onScrollToBottom();
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, x: '-50%', scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                    exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute bottom-24 left-1/2 z-30"
                >
                    <button
                        onClick={handleClick}
                        className={cn(
                            "flex items-center gap-2.5 px-5 py-3 rounded-full font-bold text-sm tracking-tight transition-all duration-300",
                            "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.5)]",
                            "hover:scale-105 hover:shadow-[0_15px_35px_-10px_rgba(124,58,237,0.6)]",
                            "active:scale-95 border border-white/20 backdrop-blur-md"
                        )}
                        aria-label={`Перейти к ${newMessageCount} новым сообщениям`}
                    >
                        <div className="relative">
                            <ChevronDown className="w-4 h-4" />
                            <motion.div 
                                animate={{ y: [0, 2, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 blur-sm bg-white/30"
                            />
                        </div>
                        <span>
                            {newMessageCount === 1 ? '1 новое сообщение' : `${newMessageCount} новых сообщений`}
                        </span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
