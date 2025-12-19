"use client";

import { useState, useEffect } from 'react';
import { MessageCircle, PenTool, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
    {
        id: 'chat',
        title: 'Чат',
        description: 'Приватное общение',
        icon: MessageCircle,
        preview: (
            <div className="space-y-3 p-4">
                <div className="flex justify-end">
                    <div className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] px-3 py-2 rounded-lg rounded-br-sm max-w-[75%] text-sm">
                        Привет! Как дела?
                    </div>
                </div>
                <div className="flex justify-start">
                    <div className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-3 py-2 rounded-lg rounded-bl-sm max-w-[75%] text-sm">
                        Отлично! А у тебя?
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] px-3 py-2 rounded-lg rounded-br-sm max-w-[75%] text-sm">
                        Тоже хорошо! 😊
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'canvas',
        title: 'Рисование',
        description: 'Совместный холст',
        icon: PenTool,
        preview: (
            <div className="p-4 h-full flex items-center justify-center">
                <div className="relative w-full h-32 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)] flex items-center justify-center overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
                        <path d="M20,50 Q50,20 80,50 T140,50" stroke="var(--accent-primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <circle cx="160" cy="30" r="6" fill="var(--text-muted)" />
                        <rect x="170" y="60" width="12" height="12" fill="var(--text-muted)" rx="2" />
                    </svg>
                </div>
            </div>
        )
    },
    {
        id: 'games',
        title: 'Игры',
        description: 'Мини-игры',
        icon: Gamepad2,
        preview: (
            <div className="p-4">
                <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto">
                    {Array.from({ length: 9 }, (_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "aspect-square rounded border flex items-center justify-center text-sm font-medium",
                                i === 0 ? "border-[var(--accent-primary)] bg-[var(--accent-light)] text-[var(--accent-primary)]" : "border-[var(--border-primary)]",
                                i === 4 ? "border-[var(--text-muted)] bg-[var(--bg-tertiary)] text-[var(--text-muted)]" : ""
                            )}
                        >
                            {i === 0 ? 'X' : i === 4 ? 'O' : ''}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-center text-[var(--text-muted)] mt-3">Крестики-нолики</p>
            </div>
        )
    }
];

export function FeaturePreview() {
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-12 px-4 bg-[var(--bg-secondary)]">
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Feature Tabs */}
                    <div className="space-y-3">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            const isActive = activeFeature === index;

                            return (
                                <button
                                    key={feature.id}
                                    onClick={() => setActiveFeature(index)}
                                    className={cn(
                                        "w-full p-4 rounded-xl border text-left transition-all duration-200",
                                        isActive
                                            ? "border-[var(--accent-primary)] bg-[var(--accent-light)]"
                                            : "border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent-primary)]/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                            isActive ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)]" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "font-medium",
                                                isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                                            )}>
                                                {feature.title}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Preview */}
                    <div>
                        <div className="h-64 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
                            {features[activeFeature].preview}
                        </div>

                        {/* Indicators */}
                        <div className="flex justify-center gap-2 mt-4">
                            {features.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveFeature(index)}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-200",
                                        activeFeature === index
                                            ? "bg-[var(--accent-primary)] w-6"
                                            : "bg-[var(--border-primary)] w-1.5 hover:bg-[var(--text-muted)]"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
