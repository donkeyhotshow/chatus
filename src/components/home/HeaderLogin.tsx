"use client";

import { useState } from 'react';
import { ChevronDown, Key, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderLoginProps {
    username: string;
    roomCode: string;
    onUsernameChange: (val: string) => void;
    onRoomCodeChange: (val: string) => void;
    onJoin: () => void;
    isConnecting: boolean;
    isValid: boolean;
}

export function HeaderLogin({
    username,
    roomCode,
    onUsernameChange,
    onRoomCodeChange,
    onJoin,
    isConnecting,
    isValid
}: HeaderLoginProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative hidden md:block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all",
                    isOpen && "bg-white/10 border-violet-500/50"
                )}
            >
                <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <User className="w-4 h-4" />
                    <span>{username || 'Войти'}</span>
                    {roomCode && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="font-mono tracking-wider text-violet-400">{roomCode}</span>
                        </>
                    )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-2xl"
                        >
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Имя</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => onUsernameChange(e.target.value)}
                                            placeholder="Ваше имя"
                                            className="w-full pl-10 pr-4 h-11 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:border-violet-500/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Код комнаты</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input
                                            type="text"
                                            value={roomCode}
                                            onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
                                            placeholder="X7Y2Z9"
                                            maxLength={6}
                                            className="w-full pl-10 pr-4 h-11 bg-white/5 border border-white/10 rounded-xl text-sm text-center font-mono tracking-[0.2em] text-white placeholder:text-white/10 focus:border-violet-500/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onJoin();
                                        setIsOpen(false);
                                    }}
                                    disabled={!isValid || isConnecting}
                                    className={cn(
                                        "w-full h-11 rounded-xl font-bold transition-all",
                                        isValid && !isConnecting
                                            ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                                            : "bg-white/5 text-white/20"
                                    )}
                                >
                                    {isConnecting ? "Вход..." : "Войти в чат"}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
