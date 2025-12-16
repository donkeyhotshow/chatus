"use client";

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
    trigger: boolean;
    type?: 'success' | 'avatar' | 'canvas' | 'achievement';
    onComplete?: () => void;
}

export function ConfettiEffect({ trigger, type = 'success', onComplete }: ConfettiEffectProps) {
    const hasTriggered = useRef(false);

    useEffect(() => {
        if (!trigger || hasTriggered.current) return;

        hasTriggered.current = true;

        const runEffect = async () => {
            switch (type) {
                case 'success':
                    await successConfetti();
                    break;
                case 'avatar':
                    await avatarConfetti();
                    break;
                case 'canvas':
                    await canvasConfetti();
                    break;
                case 'achievement':
                    await achievementConfetti();
                    break;
            }

            onComplete?.();
            // Reset after animation
            setTimeout(() => {
                hasTriggered.current = false;
            }, 1000);
        };

        runEffect();
    }, [trigger, type, onComplete]);

    return null;
}

// Успешное действие - классическое конфетти
async function successConfetti() {
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#00ffff', '#ff0080', '#8000ff', '#ffff00', '#00ff80'];

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
            shapes: ['circle', 'square'],
            scalar: 0.8,
        });

        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
            shapes: ['circle', 'square'],
            scalar: 0.8,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// Сохранение аватара - пиксельные частицы
async function avatarConfetti() {
    const colors = ['#00ffff', '#ff0080', '#ffffff', '#ffff00'];

    // Взрыв из центра
    confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
        shapes: ['square'],
        scalar: 0.6,

    });

    // Дополнительный взрыв через 200мс
    setTimeout(() => {
        confetti({
            particleCount: 30,
            spread: 100,
            origin: { y: 0.7 },
            colors: colors,
            shapes: ['circle'],
            scalar: 0.4,
        });
    }, 200);
}

// Сохранение рисунка - художественные частицы
async function canvasConfetti() {
    const colors = ['#00ffff', '#ff0080', '#8000ff', '#ffff00', '#00ff80', '#ff8000'];

    // Имитация брызг краски
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            confetti({
                particleCount: 20,
                spread: 60,
                origin: {
                    x: Math.random() * 0.6 + 0.2, // Случайная позиция по X
                    y: Math.random() * 0.4 + 0.3  // Случайная позиция по Y
                },
                colors: colors,
                shapes: ['circle'],
                scalar: 1.2,


            });
        }, i * 150);
    }
}

// Достижение - золотые звезды
async function achievementConfetti() {
    const colors = ['#ffd700', '#ffed4e', '#fff700', '#ffaa00'];

    // Звездный дождь
    confetti({
        particleCount: 100,
        spread: 160,
        origin: { y: 0.3 },
        colors: colors,
        shapes: ['star'],
        scalar: 1.5,

    });

    // Дополнительные звезды
    setTimeout(() => {
        confetti({
            particleCount: 50,
            spread: 120,
            origin: { y: 0.2 },
            colors: colors,
            shapes: ['circle', 'star'],
            scalar: 1.0,
        });
    }, 300);
}

// Хук для управления конфетти
export function useConfetti() {
    const triggerSuccess = () => successConfetti();
    const triggerAvatar = () => avatarConfetti();
    const triggerCanvas = () => canvasConfetti();
    const triggerAchievement = () => achievementConfetti();

    return {
        triggerSuccess,
        triggerAvatar,
        triggerCanvas,
        triggerAchievement,
    };
}
