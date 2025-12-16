"use client";

import { useCallback, useRef } from 'react';

// Web Audio API sound generation
class SoundDesigner {
    private audioContext: AudioContext | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported');
            }
        }
    }

    private async ensureAudioContext() {
        if (!this.audioContext) return null;

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        return this.audioContext;
    }

    // Приятный "чпок" для отправки сообщения
    async playMessageSent() {
        const ctx = await this.ensureAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Звук как в мессенджерах - короткий и приятный
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    }

    // "Вжух" для отправки рисунка
    async playCanvasSaved() {
        const ctx = await this.ensureAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Swoosh sound - от высокого к низкому
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }

    // Звук ошибки - мягкий, не пугающий
    async playError() {
        const ctx = await this.ensureAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Мягкий звук ошибки - не агрессивный
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.setValueAtTime(250, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }

    // Звук выбора цвета - короткий клик
    async playColorSelect() {
        const ctx = await this.ensureAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(600, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    }

    // Звук успеха - восходящий
    async playSuccess() {
        const ctx = await this.ensureAudioContext();
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Восходящий звук успеха
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
    }
}

// Enhanced haptic patterns
export const HapticPatterns = {
    // Базовые
    light: 10,
    medium: 25,
    heavy: 50,

    // Специальные паттерны
    messageSent: [10, 30, 10],           // Короткий-пауза-короткий
    canvasSaved: [15, 20, 15, 20, 15],   // Тройной тап
    error: [100, 50, 100],               // Двойной сильный
    success: [10, 25, 10, 25, 10],       // Радостный ритм
    colorSelect: [5],                     // Очень короткий
    buttonPress: [8],                     // Стандартный клик
    swipeGesture: [15, 10, 15],          // Жест
    longPress: [30],                      // Долгое нажатие
    notification: [20, 100, 20, 100, 20], // Уведомление
} as const;

export function useSoundDesign() {
    const soundDesigner = useRef<SoundDesigner | null>(null);

    // Lazy initialization
    const getSoundDesigner = useCallback(() => {
        if (!soundDesigner.current) {
            soundDesigner.current = new SoundDesigner();
        }
        return soundDesigner.current;
    }, []);

    const playSound = useCallback(async (soundType: keyof typeof SoundDesigner.prototype) => {
        try {
            const designer = getSoundDesigner();
            if (soundType === 'playMessageSent') await designer.playMessageSent();
            else if (soundType === 'playCanvasSaved') await designer.playCanvasSaved();
            else if (soundType === 'playError') await designer.playError();
            else if (soundType === 'playColorSelect') await designer.playColorSelect();
            else if (soundType === 'playSuccess') await designer.playSuccess();
        } catch (error) {
            console.warn('Sound playback failed:', error);
        }
    }, [getSoundDesigner]);

    const vibrate = useCallback((pattern: keyof typeof HapticPatterns | number | number[]) => {
        if (!('vibrate' in navigator)) return;

        try {
            if (typeof pattern === 'string' && pattern in HapticPatterns) {
                navigator.vibrate(HapticPatterns[pattern]);
            } else {
                navigator.vibrate(pattern as number | number[]);
            }
        } catch (error) {
            console.warn('Haptic feedback failed:', error);
        }
    }, []);

    // Комбинированные эффекты
    const playMessageSent = useCallback(async () => {
        vibrate('messageSent');
        await playSound('playMessageSent');
    }, [vibrate, playSound]);

    const playCanvasSaved = useCallback(async () => {
        vibrate('canvasSaved');
        await playSound('playCanvasSaved');
    }, [vibrate, playSound]);

    const playError = useCallback(async () => {
        vibrate('error');
        await playSound('playError');
    }, [vibrate, playSound]);

    const playSuccess = useCallback(async () => {
        vibrate('success');
        await playSound('playSuccess');
    }, [vibrate, playSound]);

    const playColorSelect = useCallback(async () => {
        vibrate('colorSelect');
        await playSound('playColorSelect');
    }, [vibrate, playSound]);

    const playButtonPress = useCallback(() => {
        vibrate('buttonPress');
    }, [vibrate]);

    return {
        // Отдельные эффекты
        playSound,
        vibrate,

        // Комбинированные эффекты
        playMessageSent,
        playCanvasSaved,
        playError,
        playSuccess,
        playColorSelect,
        playButtonPress,
    };
}
