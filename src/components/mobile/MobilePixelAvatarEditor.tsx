"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eraser, Shuffle, Palette, Undo, Redo, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

// Оптимизированная палитра для мобильных устройств
const MOBILE_PALETTE = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#AED6F1', '#F1948A', '#D7BDE2',
    '#A3E4D7', '#F9E79F', '#FADBD8', '#D5DBDB', '#2C3E50',
    '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
    '#1ABC9C', '#34495E', '#E67E22', '#95A5A6', '#16A085'
];

// Размеры для мобильной версии
const MOBILE_PIXEL_SIZE = 20;
const MOBILE_GRID_SIZE = 14;
const MOBILE_CANVAS_SIZE = MOBILE_PIXEL_SIZE * MOBILE_GRID_SIZE;

interface MobilePixelAvatarEditorProps {
    onSave: (dataUrl: string) => void;
    initialAvatar?: string;
    className?: string;
}

interface HistoryState {
    imageData: ImageData;
    timestamp: number;
}

export function MobilePixelAvatarEditor({
    onSave,
    initialAvatar,
    className
}: MobilePixelAvatarEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedColor, setSelectedColor] = useState(MOBILE_PALETTE[0]);
    const [isErasing, setIsErasing] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showPalette, setShowPalette] = useState(false);
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [lastDrawnPixel, setLastDrawnPixel] = useState<{ x: number, y: number } | null>(null);

    // Инициализация канваса
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Устанавливаем размеры канваса
        canvas.width = MOBILE_CANVAS_SIZE;
        canvas.height = MOBILE_CANVAS_SIZE;

        // Заливаем фон
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, MOBILE_CANVAS_SIZE, MOBILE_CANVAS_SIZE);

        if (initialAvatar) {
            const img = new Image();
            img.src = initialAvatar;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, MOBILE_CANVAS_SIZE, MOBILE_CANVAS_SIZE);
                drawGrid(ctx);
                saveToHistory();
            };
        } else {
            drawGrid(ctx);
            saveToHistory();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialAvatar]);

    const drawGrid = (ctx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 0.5;

        for (let i = 0; i <= MOBILE_GRID_SIZE; i++) {
            // Вертикальные линии
            ctx.beginPath();
            ctx.moveTo(i * MOBILE_PIXEL_SIZE, 0);
            ctx.lineTo(i * MOBILE_PIXEL_SIZE, MOBILE_CANVAS_SIZE);
            ctx.stroke();

            // Горизонтальные линии
            ctx.beginPath();
            ctx.moveTo(0, i * MOBILE_PIXEL_SIZE);
            ctx.lineTo(MOBILE_CANVAS_SIZE, i * MOBILE_PIXEL_SIZE);
            ctx.stroke();
        }
    };

    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, MOBILE_CANVAS_SIZE, MOBILE_CANVAS_SIZE);
        const newState: HistoryState = {
            imageData,
            timestamp: Date.now()
        };

        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newState);

            // Ограничиваем историю 20 состояниями
            if (newHistory.length > 20) {
                newHistory.shift();
                return newHistory;
            }

            return newHistory;
        });

        setHistoryIndex(prev => Math.min(prev + 1, 19));
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex <= 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const prevIndex = historyIndex - 1;
        const prevState = history[prevIndex];

        if (prevState) {
            ctx.putImageData(prevState.imageData, 0, 0);
            drawGrid(ctx);
            setHistoryIndex(prevIndex);

            // Вибрация для обратной связи
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const nextIndex = historyIndex + 1;
        const nextState = history[nextIndex];

        if (nextState) {
            ctx.putImageData(nextState.imageData, 0, 0);
            drawGrid(ctx);
            setHistoryIndex(nextIndex);

            // Вибрация для обратной связи
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        }
    }, [history, historyIndex]);

    const fillPixel = useCallback((x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const col = Math.floor(x / MOBILE_PIXEL_SIZE);
        const row = Math.floor(y / MOBILE_PIXEL_SIZE);

        // Проверяем, что пиксель в границах и не тот же самый
        if (col >= 0 && col < MOBILE_GRID_SIZE && row >= 0 && row < MOBILE_GRID_SIZE) {
            if (lastDrawnPixel && lastDrawnPixel.x === col && lastDrawnPixel.y === row) {
                return; // Не рисуем тот же пиксель повторно
            }

            ctx.fillStyle = isErasing ? '#1a1a1a' : selectedColor;
            ctx.fillRect(
                col * MOBILE_PIXEL_SIZE + 1,
                row * MOBILE_PIXEL_SIZE + 1,
                MOBILE_PIXEL_SIZE - 2,
                MOBILE_PIXEL_SIZE - 2
            );

            setLastDrawnPixel({ x: col, y: row });

            // Легкая вибрация при рисовании
            if ('vibrate' in navigator) {
                navigator.vibrate(5);
            }
        }
    }, [selectedColor, isErasing, lastDrawnPixel]);

    const getCanvasCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            const touch = e.touches[0] || e.changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = MOBILE_CANVAS_SIZE / rect.width;
        const scaleY = MOBILE_CANVAS_SIZE / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handleCanvasStart = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        setLastDrawnPixel(null);
        const { x, y } = getCanvasCoordinates(e);
        fillPixel(x, y);
    };

    const handleCanvasMove = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        const { x, y } = getCanvasCoordinates(e);
        fillPixel(x, y);
    };

    const handleCanvasEnd = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        if (isDrawing) {
            setIsDrawing(false);
            setLastDrawnPixel(null);
            saveToHistory();
        }
    };

    const generateRandomAvatar = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Очищаем канвас
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, MOBILE_CANVAS_SIZE, MOBILE_CANVAS_SIZE);

        // Генерируем случайный аватар с более интересными паттернами
        const centerX = Math.floor(MOBILE_GRID_SIZE / 2);
        const centerY = Math.floor(MOBILE_GRID_SIZE / 2);

        // Создаем симметричный аватар
        for (let i = 0; i < MOBILE_GRID_SIZE; i++) {
            for (let j = 0; j < MOBILE_GRID_SIZE / 2; j++) {
                const distance = Math.sqrt((i - centerX) ** 2 + (j - centerY) ** 2);
                const probability = Math.max(0, 0.8 - distance / (MOBILE_GRID_SIZE / 2));

                if (Math.random() < probability) {
                    const randomColor = MOBILE_PALETTE[Math.floor(Math.random() * MOBILE_PALETTE.length)];
                    ctx.fillStyle = randomColor;

                    // Рисуем пиксель и его зеркальное отражение
                    ctx.fillRect(
                        i * MOBILE_PIXEL_SIZE + 1,
                        j * MOBILE_PIXEL_SIZE + 1,
                        MOBILE_PIXEL_SIZE - 2,
                        MOBILE_PIXEL_SIZE - 2
                    );

                    const mirrorJ = MOBILE_GRID_SIZE - 1 - j;
                    ctx.fillRect(
                        i * MOBILE_PIXEL_SIZE + 1,
                        mirrorJ * MOBILE_PIXEL_SIZE + 1,
                        MOBILE_PIXEL_SIZE - 2,
                        MOBILE_PIXEL_SIZE - 2
                    );
                }
            }
        }

        drawGrid(ctx);
        saveToHistory();

        // Вибрация для обратной связи
        if ('vibrate' in navigator) {
            navigator.vibrate([30, 10, 30]);
        }
    }, [saveToHistory]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, MOBILE_CANVAS_SIZE, MOBILE_CANVAS_SIZE);
        drawGrid(ctx);
        saveToHistory();
    }, [saveToHistory]);

    // Expose clearCanvas for potential future use
    void clearCanvas;

    const handleSave = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);

        // Вибрация для подтверждения сохранения
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]);
        }
    }, [onSave]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <div className={cn("flex flex-col space-y-4", className)}>
            {/* Канвас */}
            <div className="flex justify-center">
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        className="border-2 border-white/20 rounded-xl bg-neutral-900 touch-none shadow-2xl"
                        style={{
                            width: `${Math.min(300, window.innerWidth - 32)}px`,
                            height: `${Math.min(300, window.innerWidth - 32)}px`,
                        }}
                        onMouseDown={handleCanvasStart}
                        onMouseMove={handleCanvasMove}
                        onMouseUp={handleCanvasEnd}
                        onMouseLeave={handleCanvasEnd}
                        onTouchStart={handleCanvasStart}
                        onTouchMove={handleCanvasMove}
                        onTouchEnd={handleCanvasEnd}
                    />

                    {/* Индикатор режима */}
                    <AnimatePresence>
                        {isErasing && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -top-3 -right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg"
                            >
                                Ластик
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Индикатор рисования */}
                    <AnimatePresence>
                        {isDrawing && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-3 -left-3 w-6 h-6 rounded-full shadow-lg"
                                style={{ backgroundColor: isErasing ? '#ef4444' : selectedColor }}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Панель инструментов */}
            <div className="flex gap-2 justify-center">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={cn(
                        "min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl transition-all duration-200 touch-target",
                        canUndo
                            ? "bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95"
                            : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                    )}
                >
                    <Undo className="w-5 h-5" />
                </button>

                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={cn(
                        "min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl transition-all duration-200 touch-target",
                        canRedo
                            ? "bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95"
                            : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                    )}
                >
                    <Redo className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setIsErasing(!isErasing)}
                    className={cn(
                        "min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl transition-all duration-200 touch-target",
                        isErasing
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                            : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    )}
                >
                    <Eraser className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setShowPalette(!showPalette)}
                    className={cn(
                        "min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl transition-all duration-200 touch-target relative",
                        showPalette
                            ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                            : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    )}
                >
                    <Palette className="w-5 h-5" />
                    <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                        style={{ backgroundColor: selectedColor }}
                    />
                </button>

                <button
                    onClick={generateRandomAvatar}
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded-xl transition-all duration-200 touch-target active:scale-95"
                >
                    <Shuffle className="w-5 h-5" />
                </button>

                <button
                    onClick={handleSave}
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 rounded-xl transition-all duration-200 touch-target active:scale-95 shadow-lg shadow-cyan-500/25"
                >
                    <Download className="w-5 h-5" />
                </button>
            </div>

            {/* Палитра цветов */}
            <AnimatePresence>
                {showPalette && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">Выберите цвет</span>
                            <div
                                className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg"
                                style={{ backgroundColor: selectedColor }}
                            />
                        </div>

                        <div className="grid grid-cols-6 gap-3 max-h-40 overflow-y-auto">
                            {MOBILE_PALETTE.map((color) => (
                                <motion.button
                                    key={color}
                                    onClick={() => {
                                        setSelectedColor(color);
                                        setIsErasing(false);
                                        // Вибрация при выборе цвета
                                        if ('vibrate' in navigator) {
                                            navigator.vibrate(10);
                                        }
                                    }}
                                    className={cn(
                                        "w-12 h-12 rounded-xl transition-all duration-200 touch-target shadow-lg",
                                        selectedColor === color && !isErasing
                                            ? "ring-4 ring-cyan-400 ring-offset-2 ring-offset-black scale-110 shadow-xl"
                                            : "hover:scale-105 active:scale-95"
                                    )}
                                    style={{ backgroundColor: color }}
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ scale: 1.05 }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
