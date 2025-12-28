"use client";

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { X, Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    onClose?: () => void;
    recentColors?: string[];
    className?: string;
}

// Preset colors
const PRESET_COLORS = [
    '#FFFFFF', '#000000', '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E', '#64748B', '#78716C', '#71717A',
];

/**
 * ColorPicker - Полноценный color picker с hue/saturation
 * Улучшение UI/UX - Sprint 2
 */
export const ColorPicker = memo(function ColorPicker({
    color,
    onChange,
    onClose,
    recentColors = [],
    className,
}: ColorPickerProps) {
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [brightness, setBrightness] = useState(100);
    const [hexInput, setHexInput] = useState(color);

    const satBrightRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const isDraggingSatBright = useRef(false);
    const isDraggingHue = useRef(false);

    // Convert hex to HSB on mount
    useEffect(() => {
        const hsb = hexToHsb(color);
        setHue(hsb.h);
        setSaturation(hsb.s);
        setBrightness(hsb.b);
        setHexInput(color);
    }, [color]);

    // Update color when HSB changes
    const updateColor = useCallback((h: number, s: number, b: number) => {
        const hex = hsbToHex(h, s, b);
        setHexInput(hex);
        onChange(hex);
    }, [onChange]);

    // Saturation/Brightness picker handlers
    const handleSatBrightMove = useCallback((clientX: number, clientY: number) => {
        if (!satBrightRef.current) return;
        const rect = satBrightRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        const newSat = Math.round(x * 100);
        const newBright = Math.round((1 - y) * 100);
        setSaturation(newSat);
        setBrightness(newBright);
        updateColor(hue, newSat, newBright);
    }, [hue, updateColor]);

    const handleSatBrightStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        isDraggingSatBright.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        handleSatBrightMove(clientX, clientY);
    }, [handleSatBrightMove]);

    // Hue slider handlers
    const handleHueMove = useCallback((clientX: number) => {
        if (!hueRef.current) return;
        const rect = hueRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const newHue = Math.round(x * 360);
        setHue(newHue);
        updateColor(newHue, saturation, brightness);
    }, [saturation, brightness, updateColor]);

    const handleHueStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        isDraggingHue.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        handleHueMove(clientX);
    }, [handleHueMove]);

    // Global mouse/touch move handlers
    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            if (isDraggingSatBright.current) {
                handleSatBrightMove(clientX, clientY);
            }
            if (isDraggingHue.current) {
                handleHueMove(clientX);
            }
        };

        const handleEnd = () => {
            isDraggingSatBright.current = false;
            isDraggingHue.current = false;
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [handleSatBrightMove, handleHueMove]);

    // Hex input handler
    const handleHexChange = useCallback((value: string) => {
        setHexInput(value);
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            const hsb = hexToHsb(value);
            setHue(hsb.h);
            setSaturation(hsb.s);
            setBrightness(hsb.b);
            onChange(value.toUpperCase());
        }
    }, [onChange]);

    return (
        <div className={cn(
            "bg-[var(--bg-tertiary)] rounded-2xl p-4 border border-white/10 shadow-2xl",
            "animate-in slide-in-from-bottom-4 duration-200",
            "w-full max-w-[320px]",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Pipette className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Выбор цвета</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Saturation/Brightness picker */}
            <div
                ref={satBrightRef}
                className="relative w-full aspect-square rounded-xl cursor-crosshair mb-4 overflow-hidden"
                style={{
                    background: `linear-gradient(to bottom, transparent, black),
                                 linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`
                }}
                onMouseDown={handleSatBrightStart}
                onTouchStart={handleSatBrightStart}
            >
                {/* Picker thumb */}
                <div
                    className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg pointer-events-none"
                    style={{
                        left: `${saturation}%`,
                        top: `${100 - brightness}%`,
                        backgroundColor: hexInput,
                    }}
                />
            </div>

            {/* Hue slider */}
            <div
                ref={hueRef}
                className="relative h-4 rounded-full cursor-pointer mb-4"
                style={{
                    background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                }}
                onMouseDown={handleHueStart}
                onTouchStart={handleHueStart}
            >
                <div
                    className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 top-1/2 rounded-full border-2 border-white shadow-lg pointer-events-none"
                    style={{
                        left: `${(hue / 360) * 100}%`,
                        backgroundColor: `hsl(${hue}, 100%, 50%)`,
                    }}
                />
            </div>

            {/* Color preview and hex input */}
            <div className="flex items-center gap-3 mb-4">
                <div
                    className="w-12 h-12 rounded-xl border-2 border-white/20 shadow-lg"
                    style={{ backgroundColor: hexInput }}
                />
                <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-white/10 rounded-lg text-sm text-[var(--text-primary)] font-mono uppercase"
                    placeholder="#FFFFFF"
                    maxLength={7}
                />
            </div>

            {/* Preset colors */}
            <div className="grid grid-cols-11 gap-1.5 mb-3">
                {PRESET_COLORS.map((presetColor) => (
                    <button
                        key={presetColor}
                        onClick={() => {
                            const hsb = hexToHsb(presetColor);
                            setHue(hsb.h);
                            setSaturation(hsb.s);
                            setBrightness(hsb.b);
                            setHexInput(presetColor);
                            onChange(presetColor);
                        }}
                        className={cn(
                            "w-6 h-6 rounded-md border transition-all",
                            hexInput.toUpperCase() === presetColor.toUpperCase()
                                ? "border-white scale-110 ring-2 ring-white/30"
                                : "border-white/20 hover:scale-105"
                        )}
                        style={{ backgroundColor: presetColor }}
                        title={presetColor}
                    />
                ))}
            </div>

            {/* Recent colors */}
            {recentColors.length > 0 && (
                <div>
                    <span className="text-xs text-[var(--text-muted)] mb-2 block">Недавние</span>
                    <div className="flex gap-1.5">
                        {recentColors.slice(0, 8).map((recentColor, i) => (
                            <button
                                key={`${recentColor}-${i}`}
                                onClick={() => {
                                    const hsb = hexToHsb(recentColor);
                                    setHue(hsb.h);
                                    setSaturation(hsb.s);
                                    setBrightness(hsb.b);
                                    setHexInput(recentColor);
                                    onChange(recentColor);
                                }}
                                className="w-6 h-6 rounded-md border border-white/20 hover:scale-105 transition-transform"
                                style={{ backgroundColor: recentColor }}
                                title={recentColor}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

// Helper functions
function hexToHsb(hex: string): { h: number; s: number; b: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;

    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
            case g: h = ((b - r) / d + 2) * 60; break;
            case b: h = ((r - g) / d + 4) * 60; break;
        }
    }

    return { h: Math.round(h), s: Math.round(s), b: Math.round(v) };
}

function hsbToHex(h: number, s: number, b: number): string {
    s /= 100;
    b /= 100;

    const c = b * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = b - c;

    let r = 0, g = 0, bl = 0;

    if (h < 60) { r = c; g = x; bl = 0; }
    else if (h < 120) { r = x; g = c; bl = 0; }
    else if (h < 180) { r = 0; g = c; bl = x; }
    else if (h < 240) { r = 0; g = x; bl = c; }
    else if (h < 300) { r = x; g = 0; bl = c; }
    else { r = c; g = 0; bl = x; }

    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(bl)}`.toUpperCase();
}

export default ColorPicker;
