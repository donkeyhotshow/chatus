"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Star, Users, Clock, Play } from 'lucide-react';

interface GameCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    isLoading?: boolean;
    onClick: () => void;
    className?: string;
    rating?: number;
    players?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export const GameCard: React.FC<GameCardProps> = ({
    title,
    description,
    icon,
    isLoading = false,
    onClick,
    className,
    rating = 4.5,
    players = "1-2",
    category = "Classic",
    difficulty = "medium"
}) => {
    const difficultyConfig = {
        easy: { label: 'Легко', color: 'bg-green-500/20 text-green-400 border-green-500/30', dots: 1 },
        medium: { label: 'Средне', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dots: 2 },
        hard: { label: 'Сложно', color: 'bg-red-500/20 text-red-400 border-red-500/30', dots: 3 },
    };
    const diffConfig = difficultyConfig[difficulty];
    return (
        <motion.button
            className={cn(
                "group relative flex flex-col w-full bg-neutral-900/40 border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/10",
                isLoading && "opacity-50 cursor-wait",
                className
            )}
            onClick={onClick}
            disabled={isLoading}
            aria-label={`Play ${title}`}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Top Visual Section */}
            <div className="relative h-32 w-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent)]" />
                <div className="relative z-10 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-violet-400 group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>

                {/* Category Tag */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {category}
                </div>

                {/* Difficulty Badge */}
                <div className={cn(
                    "absolute bottom-4 left-4 px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5",
                    diffConfig.color
                )}>
                    <span>{diffConfig.label}</span>
                    <span className="flex gap-0.5">
                        {[...Array(3)].map((_, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    i < diffConfig.dots ? "bg-current" : "bg-current/30"
                                )}
                            />
                        ))}
                    </span>
                </div>

                {/* Rating */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    {rating.toFixed(1)}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col text-left space-y-3">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{title}</h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{description}</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {players}
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 5-10m
                        </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-black transition-all">
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 fill-current" />
                        )}
                    </div>
                </div>
            </div>

            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
    );
};
