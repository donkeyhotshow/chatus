"use client";

import { useEffect, useRef, useCallback, memo, useState } from 'react';
import { createPortal } from 'react-dom';

interface SnowEffectProps {
    enabled: boolean;
}

interface Snowflake {
    id: number;
    x: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
}

export const SnowEffect = memo(function SnowEffect({ enabled }: SnowEffectProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!enabled || !mounted) return null;

    return createPortal(
        <SnowLayer />,
        document.body
    );
});

function SnowLayer() {
    const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const idCounterRef = useRef(0);

    const createSnowflake = useCallback((): Snowflake => {
        return {
            id: idCounterRef.current++,
            x: Math.random() * 100,
            size: Math.random() * 8 + 4,
            duration: Math.random() * 5 + 5,
            delay: Math.random() * 0.5,
            opacity: Math.random() * 0.4 + 0.6,
        };
    }, []);

    useEffect(() => {
        // Start creating snowflakes
        intervalRef.current = setInterval(() => {
            setSnowflakes(prev => {
                const newFlake = createSnowflake();
                const updated = [...prev, newFlake];
                // Limit for performance
                return updated.length > 50 ? updated.slice(-40) : updated;
            });
        }, 150);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [createSnowflake]);

    // Cleanup old snowflakes
    useEffect(() => {
        const cleanup = setInterval(() => {
            setSnowflakes(prev => prev.filter(f => {
                const age = (Date.now() - f.id) / 1000;
                return age < 12; // Remove after max animation time
            }));
        }, 2000);

        return () => clearInterval(cleanup);
    }, []);

    return (
        <div
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 9999 }}
            aria-hidden="true"
        >
            <style>{`
                @keyframes snowfall {
                    0% {
                        transform: translateY(-10px) rotate(0deg);
                        opacity: var(--snow-opacity, 0.8);
                    }
                    100% {
                        transform: translateY(110vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                .snowflake {
                    position: absolute;
                    top: -10px;
                    color: #cfe8ff;
                    text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
                    animation-name: snowfall;
                    animation-timing-function: linear;
                    animation-fill-mode: forwards;
                    user-select: none;
                }
            `}</style>
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className="snowflake"
                    style={{
                        left: `${flake.x}vw`,
                        fontSize: `${flake.size}px`,
                        animationDuration: `${flake.duration}s`,
                        animationDelay: `${flake.delay}s`,
                        // @ts-expect-error CSS custom property
                        '--snow-opacity': flake.opacity,
                    }}
                >
                    ❄
                </div>
            ))}
        </div>
    );
}
