"use client";

import { BarChart3, MessageCircle, Clock, Users } from 'lucide-react';

interface ChatStatsProps {
    messageCount: number;
    userCount: number;
    timeInChat: string;
}

export function ChatStats({ messageCount, userCount, timeInChat }: ChatStatsProps) {
    const stats = [
        { label: 'Сообщений', value: messageCount, icon: MessageCircle },
        { label: 'Участников', value: userCount, icon: Users },
        { label: 'Время в чате', value: timeInChat, icon: Clock },
    ];

    return (
        <div className="h-full flex flex-col p-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[var(--accent-light)] rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div>
                    <h2 className="font-semibold text-[var(--text-primary)]">Статистика</h2>
                    <p className="text-xs text-[var(--text-muted)]">Активность в комнате</p>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-semibold text-[var(--text-primary)]">
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                <p className="text-sm text-[var(--text-secondary)]">
                    Статистика обновляется в реальном времени. Продолжайте общаться, чтобы увидеть больше данных.
                </p>
            </div>
        </div>
    );
}
