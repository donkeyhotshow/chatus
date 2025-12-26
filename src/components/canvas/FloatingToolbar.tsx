"use client";

import { useState } from 'react';
import { PenTool, Eraser, Trash2, Brush, Tally1, Bot, Pen, Palette, Settings, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';

const NEON_COLORS = [
    '#FFFFFF', '#EF4444', '#F97316', '#F59E0B',
    '#84CC16', '#10B981', '#06B6D4', '#3B82F6',
    '#8B5CF6', '#D946EF', '#F43F5E', '#64748B'
];

// Color names for accessibility
const COLOR_NAMES: { [key: string]: string } = {
    '#FFFFFF': 'Белый',
    '#EF4444': 'Красный',
    '#F97316': 'Оранжевый',
    '#F59E0B': 'Жёлтый',
    '#84CC16': 'Лаймовый',
    '#10B981': 'Зелёный',
    '#06B6D4': 'Голубой',
    '#3B82F6': 'Синий',
    '#8B5CF6': 'Фиолетовый',
    '#D946EF': 'Розовый',
    '#F43F5E': 'Малиновый',
    '#64748B': 'Серый'
};

type BrushType = 'normal' | 'neon' | 'dashed' | 'calligraphy';

const BRUSHES: { id: BrushType, name: string, nameRu: string, icon: React.ElementType }[] = [
    { id: 'normal', name: 'Normal', nameRu: 'Обычная кисть', icon: Pen },
    { id: 'neon', name: 'Neon', nameRu: 'Неоновая кисть', icon: Brush },
    { id: 'dashed', name: 'Dashed', nameRu: 'Пунктирная кисть', icon: Tally1 },
    { id: 'calligraphy', name: 'Calligraphy', nameRu: 'Каллиграфия', icon: Bot },
];

type FloatingToolbarProps = {
    selectedTool: 'pen' | 'eraser';
    selectedColor: string;
    strokeWidth: number;
    brushType: BrushType;
    isMazeActive: boolean;
    onToolChange: (tool: 'pen' | 'eraser') => void;
    onColorChange: (color: string) => void;
    onStrokeWidthChange: (width: number) => void;
    onBrushTypeChange: (brush: BrushType) => void;
    onClearSheet: () => void;
    onSendToChat: () => void;
};

export function FloatingToolbar({
    selectedTool,
    selectedColor,
    strokeWidth,
    brushType,
    isMazeActive,
    onToolChange,
    onColorChange,
    onStrokeWidthChange,
    onBrushTypeChange,
    onClearSheet,
    onSendToChat
}: FloatingToolbarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showColorPalette, setShowColorPalette] = useState(false);

    const handleToolChange = (tool: 'pen' | 'eraser') => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        onToolChange(tool);
    };

    const handleColorChange = (color: string) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        onColorChange(color);
        setShowColorPalette(false);
    };

    const handleBrushChange = (brush: BrushType) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        onBrushTypeChange(brush);
    };

    const handleClear = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 25, 50]);
        }
        onClearSheet();
    };

    const handleSend = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        onSendToChat();
        setIsExpanded(false);
    };

    return (
        <>
            {/* Main FAB */}
            <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-3">
                {/* Expanded Tools */}
                {isExpanded && (
                    <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300">
                        {/* Color Palette - P1 Fix: Увеличенные touch-зоны для цветов */}
                        {showColorPalette && !isMazeActive && selectedTool === 'pen' && (
                            <div
                                className="bg-black/80 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-2xl animate-in slide-in-from-right-2 duration-200"
                                role="group"
                                aria-label="Палитра цветов"
                            >
                                <div className="grid grid-cols-4 gap-2">
                                    {NEON_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleColorChange(color)}
                                            aria-label={`Цвет: ${COLOR_NAMES[color] || color}`}
                                            aria-pressed={selectedColor === color}
                                            className={cn(
                                                "w-10 h-10 min-w-[40px] min-h-[40px] rounded-full transition-all duration-200 border-2 active:scale-95 touch-target",
                                                selectedColor === color
                                                    ? "ring-2 ring-white scale-110 border-white"
                                                    : "hover:scale-105 border-white/20"
                                            )}
                                            style={{
                                                backgroundColor: color,
                                                boxShadow: `0 0 8px ${color}40`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Brush Types - P1 Fix: Увеличенные touch-зоны */}
                        {!isMazeActive && selectedTool === 'pen' && (
                            <div
                                className="bg-black/80 backdrop-blur-xl rounded-2xl p-2 border border-white/10 shadow-2xl animate-in slide-in-from-right-2 duration-200"
                                role="group"
                                aria-label="Типы кистей"
                            >
                                <div className="flex flex-col gap-1">
                                    {BRUSHES.map((brush) => (
                                        <button
                                            key={brush.id}
                                            onClick={() => handleBrushChange(brush.id)}
                                            aria-label={brush.nameRu}
                                            aria-pressed={brushType === brush.id}
                                            className={cn(
                                                "p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95 touch-target",
                                                brushType === brush.id
                                                    ? "bg-white text-black"
                                                    : "bg-white/10 text-white hover:bg-white/20"
                                            )}
                                        >
                                            <brush.icon className="w-5 h-5" aria-hidden="true" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stroke Width Slider */}
                        {!isMazeActive && selectedTool === 'pen' && (
                            <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl animate-in slide-in-from-right-2 duration-200 w-48">
                                <div className="text-xs text-white/70 mb-2">Толщина: {strokeWidth}px</div>
                                <Slider
                                    value={[strokeWidth]}
                                    onValueChange={(value) => onStrokeWidthChange(value[0])}
                                    max={30}
                                    min={1}
                                    step={1}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Tool Buttons - P1 Fix: Увеличенные touch-зоны */}
                        <div
                            className="bg-black/80 backdrop-blur-xl rounded-2xl p-2 border border-white/10 shadow-2xl animate-in slide-in-from-right-2 duration-200"
                            role="toolbar"
                            aria-label="Инструменты рисования"
                        >
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => handleToolChange('pen')}
                                    disabled={isMazeActive}
                                    aria-label="Карандаш"
                                    aria-pressed={selectedTool === 'pen'}
                                    className={cn(
                                        "p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95 touch-target",
                                        selectedTool === 'pen'
                                            ? "bg-white text-black"
                                            : "bg-white/10 text-white hover:bg-white/20",
                                        isMazeActive && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <PenTool className="w-5 h-5" aria-hidden="true" />
                                </button>

                                <button
                                    onClick={() => handleToolChange('eraser')}
                                    disabled={isMazeActive}
                                    aria-label="Ластик"
                                    aria-pressed={selectedTool === 'eraser'}
                                    className={cn(
                                        "p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95 touch-target",
                                        selectedTool === 'eraser'
                                            ? "bg-white text-black"
                                            : "bg-white/10 text-white hover:bg-white/20",
                                        isMazeActive && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <Eraser className="w-5 h-5" aria-hidden="true" />
                                </button>

                                {!isMazeActive && selectedTool === 'pen' && (
                                    <button
                                        onClick={() => setShowColorPalette(!showColorPalette)}
                                        aria-label="Выбрать цвет"
                                        aria-expanded={showColorPalette}
                                        className="p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center bg-white/10 text-white hover:bg-white/20 active:scale-95 touch-target"
                                    >
                                        <Palette className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                )}

                                <button
                                    onClick={handleSend}
                                    aria-label="Отправить рисунок в чат"
                                    className="p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 active:scale-95 touch-target"
                                >
                                    <Send className="w-5 h-5" aria-hidden="true" />
                                </button>

                                <button
                                    onClick={handleClear}
                                    aria-label="Очистить холст"
                                    className="p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 active:scale-95 touch-target"
                                >
                                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Toggle Button */}
                <button
                    onClick={() => {
                        if ('vibrate' in navigator) {
                            navigator.vibrate(10);
                        }
                        setIsExpanded(!isExpanded);
                        if (!isExpanded) {
                            setShowColorPalette(false);
                        }
                    }}
                    className={cn(
                        "w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center active:scale-95",
                        isExpanded ? "rotate-45" : "hover:scale-105"
                    )}
                >
                    <Settings className="w-6 h-6" />
                </button>
            </div>

            {/* Backdrop */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm animate-in fade-in-0 duration-300"
                    onClick={() => {
                        setIsExpanded(false);
                        setShowColorPalette(false);
                    }}
                />
            )}
        </>
    );
}
