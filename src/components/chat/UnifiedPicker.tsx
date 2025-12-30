"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Sticker, Gift, Search, X, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { StickerPack } from '@/lib/telegram/types';

// Common emoji list
const QUICK_EMOJIS = ['😀', '😂', '❤️', '👍', '👎', '🎉', '🔥', '😢', '😮', '🤔', '👋', '🙏', '✨', '🚀', '💯', '✅', '❌', '👀', '🌈', '🍕', '🍺', '🎮', '📱', '💻'];

interface UnifiedPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onStickerSelect: (url: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'emoji' | 'sticker' | 'gif';

export function UnifiedPicker({
    onEmojiSelect,
    onStickerSelect,
    isOpen,
    onClose
}: UnifiedPickerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('emoji');
    const [searchQuery, setSearchQuery] = useState('');
    const [stickerPacks, setStickerPacks] = useState<StickerPack[]>([]);
    const [selectedPack, setSelectedPack] = useState<string | null>(null);
    const [isLoadingStickers, setIsLoadingStickers] = useState(false);
    const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load recent emojis
    useEffect(() => {
        const saved = localStorage.getItem('recent_emojis');
        if (saved) {
            try {
                setRecentEmojis(JSON.parse(saved));
            } catch {
                setRecentEmojis([]);
            }
        }
    }, []);

    const handleEmojiClick = useCallback((emoji: string) => {
        onEmojiSelect(emoji);
        
        // Update recent emojis
        setRecentEmojis(prev => {
            const filtered = prev.filter(e => e !== emoji);
            const updated = [emoji, ...filtered].slice(0, 12);
            localStorage.setItem('recent_emojis', JSON.stringify(updated));
            return updated;
        });
    }, [onEmojiSelect]);

    // Fetch stickers when tab changes to sticker
    useEffect(() => {
        if (activeTab === 'sticker' && stickerPacks.length === 0 && !isLoadingStickers) {
            setIsLoadingStickers(true);
            fetch('/api/stickers')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setStickerPacks(data);
                        if (data.length > 0) setSelectedPack(data[0].shortName);
                    }
                })
                .catch(err => console.error('Failed to fetch stickers', err))
                .finally(() => setIsLoadingStickers(false));
        }
    }, [activeTab, stickerPacks.length, isLoadingStickers]);

    const currentPack = stickerPacks.find(p => p.shortName === selectedPack);

    const tabs = [
        { id: 'emoji' as const, icon: Smile, label: 'Emoji' },
        { id: 'sticker' as const, icon: Sticker, label: 'Stickers' },
        { id: 'gif' as const, icon: Gift, label: 'GIFs' },
    ];

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[150] md:bg-transparent bg-black/40" onClick={onClose} />
            
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={cn(
                    "fixed md:absolute bottom-0 md:bottom-full left-0 right-0 md:left-0 md:right-auto md:mb-4",
                    "w-full md:w-[320px] h-[400px] md:h-[450px]",
                    "bg-[#121214]/95 backdrop-blur-2xl border-t md:border border-white/10 rounded-t-3xl md:rounded-2xl shadow-2xl z-[160] flex flex-col overflow-hidden"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Bar */}
                <div className="p-3 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Поиск..."
                            className="w-full pl-9 pr-4 h-9 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder:text-white/20 focus:border-violet-500/50 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
                    {activeTab === 'emoji' && (
                        <div className="space-y-4">
                            {/* Recent Emojis */}
                            {recentEmojis.length > 0 && !searchQuery && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <History className="w-3 h-3 text-white/20" />
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Недавние</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1">
                                        {recentEmojis.map((emoji) => (
                                            <button
                                                key={`recent-${emoji}`}
                                                onClick={() => handleEmojiClick(emoji)}
                                                className="aspect-square flex items-center justify-center text-2xl hover:bg-white/10 rounded-xl transition-all active:scale-90"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Emojis */}
                            <div>
                                {!searchQuery && (
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <Smile className="w-3 h-3 text-white/20" />
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Все</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-6 gap-1">
                                    {QUICK_EMOJIS.filter(e => e.includes(searchQuery) || searchQuery === '').map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleEmojiClick(emoji)}
                                            className="aspect-square flex items-center justify-center text-2xl hover:bg-white/10 rounded-xl transition-all active:scale-90"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sticker' && (
                        <div className="space-y-4">
                            {isLoadingStickers ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                                    <span className="text-xs text-white/40">Загрузка стикеров...</span>
                                </div>
                            ) : stickerPacks.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <p className="text-sm text-white/40">Нет загруженных стикеров. Вставьте ссылку на пак в чат!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2">
                                    {currentPack?.stickers.map((sticker, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onStickerSelect(sticker.localPath)}
                                            className="relative aspect-square hover:bg-white/10 rounded-xl transition-all p-1 active:scale-90"
                                        >
                                            <Image
                                                src={sticker.localPath}
                                                alt="sticker"
                                                fill
                                                className="object-contain"
                                                unoptimized
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'gif' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXF6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKMGpxxW2S9hS6I/giphy.gif',
                                    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXF6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l41lTfuxV5mX5pxS0/giphy.gif',
                                    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXF6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKVUn7iM8FMEU24/giphy.gif',
                                    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXF6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6Znd6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlUvA62C6d9d9u0/giphy.gif'
                                ].map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onStickerSelect(url)}
                                        className="relative aspect-video hover:bg-white/10 rounded-xl transition-all overflow-hidden active:scale-95"
                                    >
                                        <Image
                                            src={url}
                                            alt="gif"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-center text-white/20">Демонстрационные GIF</p>
                        </div>
                    )}
                </div>

                {/* Pack Selector (for stickers) */}
                {activeTab === 'sticker' && stickerPacks.length > 1 && (
                    <div className="px-3 py-2 border-t border-white/5 bg-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
                        {stickerPacks.map(pack => (
                            <button
                                key={pack.shortName}
                                onClick={() => setSelectedPack(pack.shortName)}
                                className={cn(
                                    "w-8 h-8 rounded-lg shrink-0 transition-all p-1",
                                    selectedPack === pack.shortName ? "bg-violet-500/20 border border-violet-500/30" : "hover:bg-white/10"
                                )}
                            >
                                <div className="relative w-full h-full">
                                    <Image src={pack.stickers[0].localPath} alt={pack.title} fill className="object-contain" unoptimized />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Bottom Tabs */}
                <div className="h-12 border-t border-white/5 flex items-center px-2 bg-black/20">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all",
                                    isActive ? "text-violet-400" : "text-white/30 hover:text-white/50"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase tracking-tighter">{tab.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 w-8 h-0.5 bg-violet-500 rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </>
    );
}
