"use client";

import { useState } from 'react';
import { LucideIcon, PenTool, Eraser, Trash2, Brush, Tally1, Bot, Pen, Send, Undo, Redo } from 'lucide-react';
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

const BRUSHES: { id: BrushType, name: string, nameRu: string, icon: LucideIcon }[] = [
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
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
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
    onSendToChat,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false
}: FloatingToolbarProps) {
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [showBrushes, setShowBrushes] = useState(false);
    const [showSlider, setShowSlider] = useState(false);

    const handleToolChange = (tool: 'pen' | 'eraser') => {
        if ('vibrate' in navigator) navigator.vibrate(10);
        onToolChange(tool);
        closeAllPanels();
    };

    const handleColorChange = (color: string) => {
        if ('vibrate' in navigator) navigator.vibrate(10);
        onColorChange(color);
        setShowColorPalette(false);
    };

    const handleBrushChange = (brush: BrushType) => {
        if ('vibrate' in navigator) navigator.vibrate(10);
        onBrushTypeChange(brush);
        setShowBrushes(false);
    };

    const handleClear = () => {
        if ('vibrate' in navigator) navigator.vibrate([50, 25, 50]);
        onClearSheet();
    };

    const handleSend = () => {
        if ('vibrate' in navigator) navigator.vibrate(10);
        onSendToChat();
    };

    const closeAllPanels = () => {
        setShowColorPalette(false);
        setShowBrushes(false);
        setShowSlider(false);
    };

    return (
        <>
            {/* Backdrop for panels */}
            {(showColorPalette || showBrushes || showSlider) && (
                <div className="fixed inset-0 z-20" onClick={closeAllPanels} />
            )}

            {/* Color Palette Panel */}
            {showColorPalette && !isMazeActive && selectedTool === 'pen' && (
                <div
                    className="fixed bottom-24 left-4 right-4 z-30 bg-[#1A1A1C] backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
                    role="group"
                    aria-label="Палитра цветов"
                >
                    <div className="grid grid-cols-6 gap-3">
                        {NEON_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => handleColorChange(color)}
                                aria-label={`Цвет: ${COLOR_NAMES[color] || color}`}
                                aria-pressed={selectedColor === color}
                                className={cn(
                                    "w-12 h-12 min-w-[48px] min-h-[48px] rounded-full transition-all duration-200 border-2 active:scale-95",
                                    selectedColor === color
                                        ? "ring-2 ring-white scale-110 border-white"
                                        : "hover:scale-105 border-white/20"
                                )}
                                style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}40` }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Brush Types Panel */}
            {showBrushes && !isMazeActive && selectedTool === 'pen' && (
                <div
                    className="fixed bottom-24 left-4 right-4 z-30 bg-[#1A1A1C] backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
                    role="group"
                    aria-label="Типы кистей"
                >
                    <div className="flex gap-3 justify-center">
                        {BRUSHES.map((brush) => (
                            <button
                                key={brush.id}
                                onClick={() => handleBrushChange(brush.id)}
                                aria-label={brush.nameRu}
                                aria-pressed={brushType === brush.id}
                                className={cn(
                                    "p-4 min-w-[56px] min-h-[56px] rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 active:scale-95",
                                    brushType === brush.id
                                        ? "bg-[#7C3AED] text-white"
                                        : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                <brush.icon className="w-6 h-6" aria-hidden="true" />
                                <span className="text-xs">{brush.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Stroke Width Slider Panel */}
            {showSlider && !isMazeActive && selectedTool === 'pen' && (
                <div className="fixed bottom-24 left-4 right-4 z-30 bg-[#1A1A1C] backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-white/70 min-w-[80px]">Толщина: {strokeWidth}px</span>
                        <div className="flex-1 h-12 flex items-center">
                            <Slider
                                value={[strokeWidth]}
                                onValueChange={(value) => onStrokeWidthChange(value[0])}
                                max={30}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>
                        {/* Preview circle */}
                        <div
                            className="w-9 h-9 rounded-full border-2 border-white/20 flex items-center justify-center"
                            style={{ backgroundColor: selectedColor }}
                        >
                            <div
                                className="rounded-full"
                                style={{
                                    width: Math.min(strokeWidth, 24),
                                    height: Math.min(strokeWidth, 24),
                                    backgroundColor: selectedColor === '#FFFFFF' ? '#000' : '#FFF'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Horizontal Toolbar - Fixed at bottom - P1-5 FIX: Mobile layout optimization */}
            <div
                className="fixed bottom-0 left-0 right-0 z-30 bg-[#1A1A1C] border-t border-white/10 safe-bottom canvas-toolbar-horizontal"
                role="toolbar"
                aria-label="Инструменты рисования"
            >
                {/* P1-5 FIX: Horizontal scroll container for narrow screens */}
                <div className="flex items-center justify-between px-3 py-2 gap-2 overflow-x-auto scrollbar-hide">
                    {/* Left: Tools */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => handleToolChange('pen')}
                            disabled={isMazeActive}
                            aria-label="Карандаш"
                            aria-pressed={selectedTool === 'pen'}
                            className={cn(
                                "p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95",
                                selectedTool === 'pen' ? "bg-[#7C3AED] text-white" : "bg-white/10 text-white hover:bg-white/20",
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
                                "p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95",
                                selectedTool === 'eraser' ? "bg-[#7C3AED] text-white" : "bg-white/10 text-white hover:bg-white/20",
                                isMazeActive && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Eraser className="w-5 h-5" aria-hidden="true" />
                        </button>

                        {onUndo && (
                            <button
                                onClick={onUndo}
                                disabled={!canUndo}
                                aria-label="Отменить"
                                className={cn(
                                    "p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95",
                                    "bg-white/10 text-white hover:bg-white/20",
                                    !canUndo && "opacity-30 cursor-not-allowed"
                                )}
                            >
                                <Undo className="w-5 h-5" aria-hidden="true" />
                            </button>
                        )}

                        {onRedo && (
                            <button
                                onClick={onRedo}
                                disabled={!canRedo}
                                aria-label="Повторить"
                                className={cn(
                                    "p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95",
                                    "bg-white/10 text-white hover:bg-white/20",
                                    !canRedo && "opacity-30 cursor-not-allowed"
                                )}
                            >
                                <Redo className="w-5 h-5" aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    {/* Center: Color preview + options - P1-5 FIX: flex-shrink-0 */}
                    {!isMazeActive && selectedTool === 'pen' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => { setShowColorPalette(!showColorPalette); setShowBrushes(false); setShowSlider(false); }}
                                aria-label="Выбрать цвет"
                                aria-expanded={showColorPalette}
                                className="p-1 rounded-xl transition-all duration-200 active:scale-95 hover:bg-white/10"
                            >
                                <div
                                    className="w-9 h-9 rounded-full border-2 border-white/30"
                                    style={{ backgroundColor: selectedColor, boxShadow: `0 0 12px ${selectedColor}50` }}
                                />
                            </button>

                            <button
                                onClick={() => { setShowBrushes(!showBrushes); setShowColorPalette(false); setShowSlider(false); }}
                                aria-label="Тип кисти"
                                aria-expanded={showBrushes}
                                className={cn(
                                    "p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95",
                                    showBrushes ? "bg-[#7C3AED] text-white" : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                <Brush className="w-5 h-5" aria-hidden="true" />
                            </button>

                            <button
                                onClick={() => { setShowSlider(!showSlider); setShowColorPalette(false); setShowBrushes(false); }}
                                aria-label="Толщина линии"
                                aria-expanded={showSlider}
                                className={cn(
                                    "p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-95 text-sm font-medium",
                                    showSlider ? "bg-[#7C3AED] text-white" : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                {strokeWidth}
                            </button>
                        </div>
                    )}

                    {/* Right: Actions - P1-5 FIX: flex-shrink-0 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={handleClear}
                            aria-label="Очистить холст"
                            className="p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 active:scale-95"
                        >
                            <Trash2 className="w-5 h-5" aria-hidden="true" />
                        </button>

                        <button
                            onClick={handleSend}
                            aria-label="Отправить рисунок в чат"
                            className="p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 flex items-center justify-center bg-[#7C3AED] text-white hover:bg-[#6D28D9] active:scale-95"
                        >
                            <Send className="w-5 h-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
