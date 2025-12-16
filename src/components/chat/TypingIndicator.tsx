"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
    typingUsers: UserProfile[];
    className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
    if (typingUsers.length === 0) return null;

    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0].name} набирает сообщение...`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0].name} и ${typingUsers[1].name} набирают сообщения...`;
        } else {
            return `${typingUsers[0].name} и еще ${typingUsers.length - 1} набирают сообщения...`;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm text-neutral-400 bg-neutral-900/50 mx-4 mb-2 rounded-lg border border-neutral-800",
                    className
                )}
            >
                {/* Typing avatars */}
                <div className="flex -space-x-2">
                    {typingUsers.slice(0, 3).map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black text-xs font-bold border-2 border-black"
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </motion.div>
                    ))}
                </div>

                {/* Typing text */}
                <span className="flex-1 font-medium">
                    {getTypingText()}
                </span>

                {/* Animated dots */}
                <div className="flex items-center gap-1">
                    {[0, 1, 2].map((index) => (
                        <motion.div
                            key={index}
                            className="w-2 h-2 bg-cyan-400 rounded-full"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: index * 0.15
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
