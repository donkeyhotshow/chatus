"use client";

import { useEffect, useRef, memo, useState } from 'react';
import { createPortal } from 'react-dom';

interface SnowEffectProps {
    enabled: boolean;
}

interface Snowflake {
    x: number;
    y: number;
    size: number;
    speed: number;
    wind: number;
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
        <SnowCanvas />,
        document.body
    );
});

function SnowCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const snowflakesRef = useRef<Snowflake[]>([]);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const updateSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initSnowflakes();
        };

        const initSnowflakes = () => {
            const count = Math.floor((window.innerWidth * window.innerHeight) / 8000); // Dynamic count based on screen size
            const flakes: Snowflake[] = [];
            for (let i = 0; i < count; i++) {
                flakes.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 3 + 1,
                    speed: Math.random() * 1 + 0.5,
                    wind: Math.random() * 0.5 - 0.25,
                    opacity: Math.random() * 0.5 + 0.3
                });
            }
            snowflakesRef.current = flakes;
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';

            snowflakesRef.current.forEach(flake => {
                ctx.globalAlpha = flake.opacity;
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
                ctx.fill();

                flake.y += flake.speed;
                flake.x += flake.wind;

                if (flake.y > canvas.height) {
                    flake.y = -flake.size;
                    flake.x = Math.random() * canvas.width;
                }
                if (flake.x > canvas.width) flake.x = 0;
                if (flake.x < 0) flake.x = canvas.width;
            });

            animationFrameRef.current = requestAnimationFrame(render);
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        render();

        return () => {
            window.removeEventListener('resize', updateSize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ 
                zIndex: 50,
                background: 'transparent',
                pointerEvents: 'none',
                touchAction: 'none',
                userSelect: 'none'
            }}
        />
    );
}
