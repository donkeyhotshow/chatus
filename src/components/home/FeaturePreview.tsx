"ent";

import { useState } from 'react';
import { MessageCircle, PenTool, Gamepad2, Play, Pause } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const features = [
    {
        id: 'chat',
        title: 'Приватный чат',
        description: 'Безопасное общение один на один',
        icon: MessageCircle,
        color: 'from-blue-500 to-blue-600',
        preview: (
            <div className="space-y-3 p-4">
                <div className="flex justify-end">
                    <div className="bg-[var(--accent-primary)] text-white px-3 py-2 rounded-lg rounded-br-sm max-w-[80%]">
                        Привет! Как дела?
                    </div>
                </div>
                <div className="flex justify-start">
                    <div className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-3 py-2 rounded-lg rounded-bl-sm max-w-[80%]">
                        Отлично! А у тебя?
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="bg-[var(--accent-primary)] text-white px-3 py-2 rounded-lg rounded-br-sm max-w-[80%]">
                        Тоже хорошо! 😊
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'canvas',
        title: 'Совместное рисование',
        description: 'Рисуйте вместе в реальном времени',
        icon: PenTool,
        color: 'from-purple-500 to-purple-600',
        preview: (
            <div className="p-4 h-full flex items-center justify-center">
                <div className="relative w-full h-32 bg-white rounded-lg border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center">
                    <div className="text-center text-[var(--text-muted)]">
                        <PenTool className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Холст для рисования</p>
                    </div>
                    {/* Имитация рисунка */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
                        <path
                            d="M20,50 Q50,20 80,50 T140,50"
                            stroke="var(--accent-primary)"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                        />
                        <circle cx="160" cy="30" r="8" fill="purple" />
                        <rect x="170" y="60" width="15" height="15" fill="green" />
                    </svg>
                </div>
            </div>
        )
    },
    {
        id: 'games',
        title: 'Мини-игры',
        description: 'Играйте в простые игры вместе',
        icon: Gamepad2,
        color: 'from-green-500 to-green-600',
        preview: (
            <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 9 }, (_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "aspect-square rounded border-2 flex items-center justify-center text-lg font-bold",
                                i === 0 ? "border-[var(--accent-primary)] bg-[var(--accent-light)] text-[var(--accent-primary)]" : "border-[var(--border-primary)]",
                                i === 4 ? "border-red-500 bg-red-50 text-red-600" : ""
                            )}
                        >
                            {i === 0 ? 'X' : i === 4 ? 'O' : ''}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-center text-[var(--text-muted)]">Крестики-нолики</p>
            </div>
        )
    }
];

export function FeaturePreview() {
    const [activeFeature, setActiveFeature] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    // Автоматическое переключение превью
    useState(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);

        return () => clearInterval(interval);
    });

    return (
        <section className="py-16 px-6 bg-[var(--bg-primary)]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
                        Все в одном месте
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        ChatUs объединяет общение, творчество и развлечения в одном приватном пространстве
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Feature Tabs */}
                    <div className="space-y-4">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            const isActive = activeFeature === index;

                            return (
                                <Card
                                    key={feature.id}
                                    className={cn(
                                        "p-6 cursor-pointer transition-all duration-300 border-2",
                                        isActive
                                            ? "border-[var(--accent-primary)] bg-[var(--accent-light)] shadow-[var(--shadow-md)]"
                                            : "border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 hover:shadow-[var(--shadow-sm)]"
                                    )}
                                    onClick={() => setActiveFeature(index)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            isActive ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                        )}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={cn(
                                                "text-lg font-semibold mb-1",
                                                isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                                            )}>
                                                {feature.title}
                                            </h3>
                                            <p className="text-[var(--text-secondary)] text-sm">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}

                        {/* Play/Pause Control */}
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="w-4 h-4 mr-2" />
                                        Пауза
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Воспроизвести
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Feature Preview */}
                    <div className="lg:pl-8">
                        <Card className="h-80 overflow-hidden border-0 shadow-[var(--shadow-lg)]">
                            <div className="h-full bg-[var(--bg-secondary)]">
                                {features[activeFeature].preview}
                            </div>
                        </Card>

                        {/* Feature Indicators */}
                        <div className="flex justify-center gap-2 mt-4">
                            {features.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveFeature(index)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        activeFeature === index
                                            ? "bg-[var(--accent-primary)] w-6"
                                            : "bg-[var(--border-primary)] hover:bg-[var(--accent-primary)]/50"
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
