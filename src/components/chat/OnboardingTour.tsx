"use client";

import { useState, useEffect } from 'react';
import { LucideIcon, MessageCircle, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
    title: string;
    description: string;
    icon: LucideIcon;
    features?: string[];
}

// Сокращенный onboarding: 2 шага вместо 4
const steps: OnboardingStep[] = [
    {
        title: 'Добро пожаловать!',
        description: 'Приватный чат для двоих',
        icon: MessageCircle,
        features: ['💬 Сообщения в реальном времени', '📷 Фото и стикеры', '🔒 Полная приватность'],
    },
    {
        title: 'Больше возможностей',
        description: 'Свайпайте для доступа к функциям',
        icon: Sparkles,
        features: ['🎨 Рисуйте вместе', '🎮 Мини-игры', '👆 Свайп влево/вправо'],
    },
];

interface OnboardingTourProps {
    onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('chatusOnboardingComplete', 'true');
        setTimeout(onComplete, 300);
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isVisible) return null;

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <div className={cn(
            "fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4",
            "animate-fade-in"
        )}>
            <div className="bg-[var(--bg-elevated)] rounded-2xl max-w-sm w-full p-6 relative shadow-2xl border border-[var(--border-primary)]">
                {/* Skip button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                    Пропустить
                </button>

                {/* Icon */}
                <div className="w-14 h-14 bg-[var(--accent-light)] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-[var(--accent-primary)]" />
                </div>

                {/* Content */}
                <h2 className="text-lg font-semibold text-[var(--text-primary)] text-center mb-1">
                    {step.title}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] text-center mb-4">
                    {step.description}
                </p>

                {/* Features list */}
                {step.features && (
                    <div className="space-y-2 mb-6 bg-[var(--bg-secondary)] rounded-lg p-3">
                        {step.features.map((feature, idx) => (
                            <div key={idx} className="text-sm text-[var(--text-primary)]">
                                {feature}
                            </div>
                        ))}
                    </div>
                )}

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-4">
                    {steps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentStep(index)}
                            className={cn(
                                "h-1.5 rounded-full transition-all",
                                index === currentStep
                                    ? "bg-[var(--accent-primary)] w-6"
                                    : "bg-[var(--border-primary)] w-1.5 hover:bg-[var(--text-muted)]"
                            )}
                        />
                    ))}
                </div>

                {/* Single button */}
                <button
                    onClick={handleNext}
                    className="w-full py-3 bg-[var(--accent-primary)] text-[var(--accent-contrast)] rounded-xl font-medium hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-2"
                >
                    {currentStep === steps.length - 1 ? 'Начать чат' : 'Далее'}
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export function useOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem('chatusOnboardingComplete');
        if (!completed) {
            setShowOnboarding(true);
        }
    }, []);

    return {
        showOnboarding,
        completeOnboarding: () => setShowOnboarding(false),
    };
}
