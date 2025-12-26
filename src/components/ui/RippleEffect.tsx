"use client";

im { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Ripple {
    id: number;
    x: number;
    y: number;
    size: number;
}

interface RippleEffectProps {
    children: React.ReactNode;
    className?: string;
    color?: string;
    duration?: number;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
}

/**
 * RippleEffect - Material Design ripple effect on click/tap
 */
export function RippleEffect({
    children,
    className,
    color = 'rgba(255, 255, 255, 0.3)',
    duration = 600,
    disabled = false,
    onClick,
}: RippleEffectProps) {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const nextIdRef = useRef(0);

    const addRipple = useCallback((clientX: number, clientY: number) => {
        if (disabled || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2;

        const newRipple: Ripple = {
            id: nextIdRef.current++,
            x: x - size / 2,
            y: y - size / 2,
            size,
        };

        setRipples(prev => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, duration);
    }, [disabled, duration]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        addRipple(e.clientX, e.clientY);
        onClick?.(e);
    }, [addRipple, onClick]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        addRipple(touch.clientX, touch.clientY);
    }, [addRipple]);

    return (
        <div
            ref={containerRef}
            className={cn('relative overflow-hidden', className)}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
        >
            {children}
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute rounded-full pointer-events-none animate-ripple"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size,
                        backgroundColor: color,
                        animationDuration: `${duration}ms`,
                    }}
                />
            ))}
        </div>
    );
}

/**
 * useRipple - Hook for adding ripple effect to any element
 */
export function useRipple(options: {
    color?: string;
    duration?: number;
    disabled?: boolean;
} = {}) {
    const { color = 'rgba(255, 255, 255, 0.3)', duration = 600, disabled = false } = options;
    const containerRef = useRef<HTMLElement>(null);
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const nextIdRef = useRef(0);

    const createRipple = useCallback((e: MouseEvent | TouchEvent) => {
        if (disabled || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let clientX: number, clientY: number;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2;

        const newRipple: Ripple = {
            id: nextIdRef.current++,
            x: x - size / 2,
            y: y - size / 2,
            size,
        };

        setRipples(prev => [...prev, newRipple]);

        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, duration);
    }, [disabled, duration]);

    useEffect(() => {
        const element = containerRef.current;
        if (!element || disabled) return;

        element.addEventListener('mousedown', createRipple);
        element.addEventListener('touchstart', createRipple);

        return () => {
            element.removeEventListener('mousedown', createRipple);
            element.removeEventListener('touchstart', createRipple);
        };
    }, [createRipple, disabled]);

    const RippleContainer = useCallback(() => (
        <>
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute rounded-full pointer-events-none animate-ripple"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size,
                        backgroundColor: color,
                        animationDuration: `${duration}ms`,
                    }}
                />
            ))}
        </>
    ), [ripples, color, duration]);

    return { containerRef, RippleContainer };
}
