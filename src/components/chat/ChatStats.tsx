"use client";

import { motion } from 'framer-motion';
import { BarChart3, MessageCircle, Clock, Trophy, Zap, Target } from 'lucide-react';

interface ChatStatsProps {
    messageCount: number;
    userCount: number;
    timeInChat: string;
}

export function ChatStats({ messageCount, userCount, timeInChat }: ChatStatsProps) {
    const stats = [
        { label: 'Сообщений', value: messageCount, icon: MessageCircle, color: 'text-cyan-400' },
        { label: 'Участников', value: userCount, icon: Zap, color: 'text-purple-400' },
        { label: 'Время в чате', value: timeInChat, icon: Clock, color: 'text-green-400' },
        { label: 'Достижения', value: '3/12', icon: Trophy, color: 'text-yellow-400' },
    ];

    return (
        <div className="h-full flex flex-col p-8 space-y-10 overflow-y-auto bg-transparent">
            <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 text-neutral-400">
                    <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Статистика</h2>
                    <p className="text-neutral-500 text-xs">Ваша активность в этой комнате</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                                <stat.icon className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest">Live</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
                        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 opacity-50">
                    <Target className="w-4 h-4" /> Цели на сегодня
                </h3>
                <div className="space-y-4">
                    {[
                        { label: 'Отправить 50 сообщений', progress: 65, color: 'bg-cyan-500' },
                        { label: 'Выиграть в 3 игры', progress: 33, color: 'bg-purple-500' },
                        { label: 'Нарисовать шедевр', progress: 100, color: 'bg-green-500' },
                    ].map((goal, index) => (
                        <div key={goal.label} className="space-y-2">
                            <div className="flex justify-between text-[11px] font-medium">
                                <span className="text-neutral-400">{goal.label}</span>
                                <span className="text-neutral-500 font-mono">{goal.progress}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${goal.progress}%` }}
                                    transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                                    className={`h-full ${goal.color} opacity-80`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

