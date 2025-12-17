"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EnhancedTypingIndicatorProps {
    typingUsers: UserProfile[];
    className?: string;
}

export function EnhancedTypingIndicator({ typingUsers, className }: EnhancedTypingIndicatorProps) {
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
                transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                }}
                className={cn(
                    "flex items-center gap-4 px-6 py-4 text-sm text-slate-200 bg-gradient-to-r from-slate-900/95 via-slate-800/98 to-slate-900/95 mx-4 mb-3 rounded-2xl border border-cyan-500/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,188,212,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]",
                    className
                )}
            >
                {/* Typing avatars with stagger animation */}
                <div className="flex -space-x-2">
                    {typingUsers.slice(0, 3).map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            className="relative"
                        >
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-black text-sm font-bold border-2 border-slate-900 shadow-[0_4px_16px_rgba(0,188,212,0.4)] relative overflow-hidden">
                                {user.name.charAt(0).toUpperCase()}
                                {/* Inner glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
                            </div>

                            {/* Enhanced pulse effect */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/40 to-purple-500/40"
                                animate={{
                                    scale: [1, 1.6, 1],
                                    opacity: [0.6, 0, 0.6]
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    delay: index * 0.4,
                                    ease: "easeInOut"
                                }}
                            />
                            {/* Secondary pulse */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/30 to-pink-500/30"
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.4, 0, 0.4]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: index * 0.2,
                                    ease: "easeInOut"
                                }}
                            />
                        </motion.div>
                    ))}

                    {/* Show count if more than 3 users */}
                    {typingUsers.length > 3 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-cyan-300 text-sm font-bold border-2 border-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                        >
                            +{typingUsers.length - 3}
                        </motion.div>
                    )}
                </div>

                {/* Typing text with typewriter effect */}
                <motion.span
                    className="flex-1 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {getTypingText()}
                </motion.span>

                {/* Premium animated dots */}
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((index) => (
                        <motion.div
                            key={index}
                            className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_2px_8px_rgba(0,188,212,0.4)]"
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.4, 1, 0.4],
                                y: [0, -6, 0],
                                boxShadow: [
                                    "0_2px_8px_rgba(0,188,212,0.4)",
                                    "0_4px_16px_rgba(0,188,212,0.8)",
                                    "0_2px_8px_rgba(0,188,212,0.4)"
                                ]
                            }}
                            transition={{
                                duration: 1.4,
                                repeat: Infinity,
                                delay: index * 0.2,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>

                {/* Subtle background animation */}
                <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5"
                    animate={{
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>
        </AnimatePresence>
    );
}
