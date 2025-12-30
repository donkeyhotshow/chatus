"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageCircle, ChevronUp, ChevronDown, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, UserProfile } from '@/lib/types';
import MessageList from './MessageList';

interface ChatPeekProps {
    messages: Message[];
    user: UserProfile | null;
    onSend: (text: string) => void;
}

export function ChatPeek({ messages, user, onSend }: ChatPeekProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputText, setInputText] = useState('');
    const dragControls = useDragControls();

    const handleSend = () => {
        if (inputText.trim()) {
            onSend(inputText.trim());
            setInputText('');
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
            <motion.div
                drag="y"
                dragControls={dragControls}
                dragConstraints={{ top: -400, bottom: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                    if (info.offset.y < -100) setIsExpanded(true);
                    if (info.offset.y > 100) setIsExpanded(false);
                }}
                animate={{ height: isExpanded ? 450 : 60 }}
                className={cn(
                    "bg-[#121214]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300",
                    isExpanded ? "pb-safe" : "pb-0"
                )}
            >
                {/* Handle / Header */}
                <div 
                    className="h-14 flex items-center justify-between px-6 shrink-0 cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <MessageCircle className="w-5 h-5 text-violet-400" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                        </div>
                        <span className="text-sm font-semibold text-white">Чат</span>
                    </div>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-white/40" /> : <ChevronUp className="w-5 h-5 text-white/40" />}
                    </button>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            <div className="flex-1 min-h-0 bg-black/20">
                                <MessageList 
                                    messages={messages} 
                                    isLoading={false}
                                    currentUserId={user?.id || ''}
                                    onDeleteMessage={() => {}}
                                    onReaction={() => {}}
                                    onImageClick={() => {}}
                                    onReply={() => {}}
                                />
                            </div>
                            
                            {/* Mini Input */}
                            <div className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
                                <input 
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Сообщение..."
                                    className="flex-1 h-10 bg-white/5 border border-white/10 rounded-full px-4 text-sm text-white outline-none focus:border-violet-500/50"
                                />
                                <button 
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:grayscale transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
