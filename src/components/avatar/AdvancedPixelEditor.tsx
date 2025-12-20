"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Undo,
    Redo,
    Layers,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    Pipette,
    Brush,
    Square,
    Circle,
    Eraser,
    Palette,
    Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Расширенная палитра цветов
const EXTENDED_PALETTE = [
    // Основные цвета
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFFFFF', '#000000', '#808080', '#C0C0C0', '#800000', '#008000',
    '#000080', '#808000', '#800080', '#008080', '#FFA500', '#FFC0CB',

    // Пастельные тона
    '#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C', '#E0E0E0',
    '#FFEFD5', '#F5DEB3', '#D2B48C', '#BC8F8F', '#F4A460', '#DAA520',

    // Яркие цвета
    '#FF6347', '#32CD32', '#1E90FF', '#FF1493', '#00CED1', '#FFD700',
    '#DC143C', '#00FA9A', '#4169E1', '#FF69B4', '#00BFFF', '#ADFF2F',

    // Темные тона
    '#8B0000', '#006400', '#00008B', '#8B008B', '#556B2F', '#8B4513',
    '#2F4F4F', '#483D8B', '#8B008B', '#B22222', '#228B22', '#4682B4'
];

interface Layer {
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    imageData: ImageData | null;
}

interface HistoryState {
    layers: Layer[];
    activeLayerId: string;
    timestamp: number;
}

interface Tool {
    id: string;
    name: string;
    icon: React.ElementType;
    cursor: string;
}

const TOOLS: Tool[] = [
    { id: 'brush', name: 'Кисть', icon: Brush, cursor: 'crosshair' },
    { id: 'eraser', name: 'Ластик', icon: Eraser, cursor: 'crosshair' },
    { id: 'pipette', name: 'Пипетка', icon: Pipette, cursor: 'crosshair' },
    { id: 'fill', name: 'Заливка', icon: Square, cursor: 'crosshair' },
    { id: 'line', name: 'Линия', icon: Circle, cursor: 'crosshair' }
];

const BRUSH_SIZES = [1, 2, 3, 4];

interface AdvancedPixelEditorProps {
    width?: number;
    height?: number;
    pixelSize?: number;
    onSave?: (dataUrl: string) => void;
    initialImage?: string;
    className?: string;
}

export function AdvancedPixelEditor({
    width = 16,
    height = 16,
    pixelSize = 20,
    onSave,
    initialImage,
    className
}: AdvancedPixelEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedColor, setSelectedColor] = useState('#FF0000');
    const [selectedTool, setSelectedTool] = useState('brush');
    const [brushSize, setBrushSize] = useState(1);
    const [layers, setLayers] = useState<Layer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState('');
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showLayers, setShowLayers] = useState(false);
    const [showPalette, setShowPalette] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const canvasWidth = width * pixelSize;
    const canvasHeight = height * pixelSize;

    const saveToHistory = useCallback((newLayers: Layer[], newActiveLayerId: string) => {
        const newState: HistoryState = {
            layers: newLayers.map(layer => ({
                ...layer,
                imageData: layer.imageData ? new ImageData(
                    new Uint8ClampedArray(layer.imageData.data),
                    layer.imageData.width,
                    layer.imageData.height
                ) : null
            })),
            activeLayerId: newActiveLayerId,
            timestamp: Date.now()
        };

        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newState);

            // Ограничиваем историю 50 состояниями
            if (newHistory.length > 50) {
                newHistory.shift();
                return newHistory;
            }

            return newHistory;
        });

        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const loadImageToLayer = useCallback((imageUrl: string, layerId: string) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

                setLayers(prev => prev.map(layer =>
                    layer.id === layerId ? { ...layer, imageData } : layer
                ));
            }
        };
        img.src = imageUrl;
    }, [canvasWidth, canvasHeight]);

    const initializeEditor = useCallback(() => {
        const initialLayer: Layer = {
            id: 'layer-1',
            name: 'Слой 1',
            visible: true,
            opacity: 1,
            imageData: null
        };

        setLayers([initialLayer]);
        setActiveLayerId(initialLayer.id);

        if (initialImage) {
            loadImageToLayer(initialImage, initialLayer.id);
        } else {
            saveToHistory([initialLayer], initialLayer.id);
        }
    }, [initialImage, loadImageToLayer, saveToHistory]);

    // Инициализация
    useEffect(() => {
        initializeEditor();
    }, [initializeEditor]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const prevState = history[prevIndex];

            if (prevState) {
                setLayers(prevState.layers);
                setActiveLayerId(prevState.activeLayerId);
                setHistoryIndex(prevIndex);

                // Вибрация для обратной связи
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
            }
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const nextState = history[nextIndex];

            if (nextState) {
                setLayers(nextState.layers);
                setActiveLayerId(nextState.activeLayerId);
                setHistoryIndex(nextIndex);

                // Вибрация для обратной связи
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
            }
        }
    }, [history, historyIndex]);

    const drawTransparencyGrid = useCallback((ctx: CanvasRenderingContext2D) => {
        const gridSize = 8;
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = '#e0e0e0';
        for (let x = 0; x < canvasWidth; x += gridSize) {
            for (let y = 0; y < canvasHeight; y += gridSize) {
                if ((Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0) {
                    ctx.fillRect(x, y, gridSize, gridSize);
                }
            }
        }
    }, [canvasWidth, canvasHeight]);

    const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = '#00000020';
        ctx.lineWidth = 1;

        for (let x = 0; x <= width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * pixelSize, 0);
            ctx.lineTo(x * pixelSize, canvasHeight);
            ctx.stroke();
        }

        for (let y = 0; y <= height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * pixelSize);
            ctx.lineTo(canvasWidth, y * pixelSize);
            ctx.stroke();
        }
    }, [width, height, pixelSize, canvasWidth, canvasHeight]);

    // Рендеринг всех слоев
    const renderLayers = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Очищаем канвас
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Рисуем шахматную доску для прозрачности
        drawTransparencyGrid(ctx);

        // Рендерим каждый видимый слой
        layers.forEach(layer => {
            if (layer.visible && layer.imageData) {
                ctx.globalAlpha = layer.opacity;
                ctx.putImageData(layer.imageData, 0, 0);
            }
        });

        ctx.globalAlpha = 1;

        // Рисуем сетку
        if (!previewMode) {
            drawGrid(ctx);
        }
    }, [layers, canvasWidth, canvasHeight, previewMode, drawGrid, drawTransparencyGrid]);

    // Обновляем рендер при изменении слоев
    useEffect(() => {
        renderLayers();
    }, [renderLayers]);

    // Обновляем превью
    useEffect(() => {
        const previewCanvas = previewCanvasRef.current;
        const mainCanvas = canvasRef.current;

        if (previewCanvas && mainCanvas) {
            const previewCtx = previewCanvas.getContext('2d');
            if (previewCtx) {
                previewCtx.imageSmoothingEnabled = false;
                previewCtx.clearRect(0, 0, 64, 64);
                previewCtx.drawImage(mainCanvas, 0, 0, 64, 64);
            }
        }
    }, [layers]);

    const getPixelCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

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

        const x = Math.floor((clientX - rect.left) / pixelSize);
        const y = Math.floor((clientY - rect.top) / pixelSize);

        return { x, y };
    };

    const drawPixel = (x: number, y: number, color: string) => {
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (!activeLayer) return;

        // Создаем временный канвас для слоя
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) return;

        // Копируем существующие данные слоя
        if (activeLayer.imageData) {
            tempCtx.putImageData(activeLayer.imageData, 0, 0);
        }

        // Рисуем новый пиксель
        if (selectedTool === 'eraser') {
            tempCtx.globalCompositeOperation = 'destination-out';
        } else {
            tempCtx.globalCompositeOperation = 'source-over';
            tempCtx.fillStyle = color;
        }

        // Рисуем с учетом размера кисти
        const halfBrush = Math.floor(brushSize / 2);
        for (let dx = -halfBrush; dx <= halfBrush; dx++) {
            for (let dy = -halfBrush; dy <= halfBrush; dy++) {
                const pixelX = x + dx;
                const pixelY = y + dy;

                if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                    tempCtx.fillRect(
                        pixelX * pixelSize,
                        pixelY * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }

        // Сохраняем обновленные данные слоя
        const newImageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);

        setLayers(prev => prev.map(layer =>
            layer.id === activeLayerId
                ? { ...layer, imageData: newImageData }
                : layer
        ));
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const coords = getPixelCoordinates(e);
        if (!coords) return;

        setIsDrawing(true);

        if (selectedTool === 'pipette') {
            // Пипетка - извлекаем цвет
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const imageData = ctx.getImageData(
                        coords.x * pixelSize + pixelSize / 2,
                        coords.y * pixelSize + pixelSize / 2,
                        1,
                        1
                    );
                    const [r, g, b] = imageData.data;
                    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                    setSelectedColor(hex);
                }
            }
        } else {
            drawPixel(coords.x, coords.y, selectedColor);
        }
    };
    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || selectedTool === 'pipette') return;

        const coords = getPixelCoordinates(e);
        if (!coords) return;

        drawPixel(coords.x, coords.y, selectedColor);
    };

    const handleCanvasMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory(layers, activeLayerId);
        }
    };

    const addLayer = () => {
        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            name: `Слой ${layers.length + 1}`,
            visible: true,
            opacity: 1,
            imageData: null
        };

        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        saveToHistory([...layers, newLayer], newLayer.id);
    };

    const deleteLayer = (layerId: string) => {
        if (layers.length <= 1) return;

        const newLayers = layers.filter(l => l.id !== layerId);
        const newActiveId = newLayers[0]?.id || '';

        setLayers(newLayers);
        setActiveLayerId(newActiveId);
        saveToHistory(newLayers, newActiveId);
    };

    const toggleLayerVisibility = (layerId: string) => {
        setLayers(prev => prev.map(layer =>
            layer.id === layerId
                ? { ...layer, visible: !layer.visible }
                : layer
        ));
    };

    const exportImage = () => {
        const canvas = canvasRef.current;
        if (canvas && onSave) {
            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl);

            // Вибрация для подтверждения
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 30, 50]);
            }
        }
    };

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <div className={cn("flex flex-col space-y-4", className)}>
            {/* Панель инструментов */}
            <div className="flex flex-wrap gap-2 p-3 bg-neutral-900/50 rounded-xl border border-neutral-700">
                {/* Инструменты */}
                <div className="flex gap-1">
                    {TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        return (
                            <button
                                key={tool.id}
                                onClick={() => setSelectedTool(tool.id)}
                                className={cn(
                                    "min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-200 touch-target",
                                    selectedTool === tool.id
                                        ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                                )}
                                title={tool.name}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                        );
                    })}
                </div>

                {/* Разделитель */}
                <div className="w-px bg-neutral-700 mx-2" />

                {/* Размер кисти */}
                <div className="flex gap-1">
                    {BRUSH_SIZES.map((size) => (
                        <button
                            key={size}
                            onClick={() => setBrushSize(size)}
                            className={cn(
                                "min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-200 touch-target text-sm font-medium",
                                brushSize === size
                                    ? "bg-cyan-500 text-white"
                                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                            )}
                        >
                            {size}
                        </button>
                    ))}
                </div>

                {/* Разделитель */}
                <div className="w-px bg-neutral-700 mx-2" />

                {/* История */}
                <div className="flex gap-1">
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className={cn(
                            "min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-200 touch-target",
                            canUndo
                                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                                : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                        )}
                    >
                        <Undo className="w-5 h-5" />
                    </button>

                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        className={cn(
                            "min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-200 touch-target",
                            canRedo
                                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                                : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                        )}
                    >
                        <Redo className="w-5 h-5" />
                    </button>
                </div>

                {/* Разделитель */}
                <div className="w-px bg-neutral-700 mx-2" />

                {/* Дополнительные функции */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setShowLayers(!showLayers)}
                        className={cn(
                            "min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-200 touch-target",
                            showLayers
                                ? "bg-cyan-500 text-white"
                                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        )}
                    >
                        <Layers className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setShowPalette(!showPalette)}
                        className={cn(
                            "min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-200 touch-target relative",
                            showPalette
                                ? "bg-cyan-500 text-white"
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
                        onClick={() => setPreviewMode(!previewMode)}
                        className={cn(
                            "min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-200 touch-target",
                            previewMode
                                ? "bg-cyan-500 text-white"
                                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        )}
                    >
                        {previewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={exportImage}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 touch-target shadow-lg shadow-cyan-500/25"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Основная область */}
            <div className="flex gap-4">
                {/* Канвас */}
                <div className="flex-1 flex flex-col items-center">
                    <canvas
                        ref={canvasRef}
                        width={canvasWidth}
                        height={canvasHeight}
                        className={cn(
                            "border-2 border-white/20 rounded-xl bg-white shadow-2xl touch-none",
                            selectedTool === 'pipette' ? 'cursor-crosshair' : 'cursor-crosshair'
                        )}
                        style={{
                            width: `${Math.min(400, canvasWidth)}px`,
                            height: `${Math.min(400, canvasHeight)}px`,
                            imageRendering: 'pixelated'
                        }}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                    />

                    {/* Превью */}
                    <div className="mt-4 flex items-center gap-3">
                        <span className="text-sm text-neutral-400">Превью:</span>
                        <canvas
                            ref={previewCanvasRef}
                            width={64}
                            height={64}
                            className="w-16 h-16 border border-neutral-600 rounded-lg bg-white"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    </div>
                </div>

                {/* Боковые панели */}
                <div className="flex flex-col gap-4">
                    {/* Палитра цветов */}
                    <AnimatePresence>
                        {showPalette && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-64 p-4 bg-neutral-900/50 rounded-xl border border-neutral-700"
                            >
                                <h3 className="text-sm font-medium text-white mb-3">Палитра</h3>
                                <div className="grid grid-cols-6 gap-2">
                                    {EXTENDED_PALETTE.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg transition-all duration-200 touch-target",
                                                selectedColor === color
                                                    ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-neutral-900 scale-110"
                                                    : "hover:scale-105"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>

                                {/* Кастомный цвет */}
                                <div className="mt-4">
                                    <label className="block text-xs text-neutral-400 mb-2">Свой цвет</label>
                                    <input
                                        type="color"
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="w-full h-8 rounded-lg border border-neutral-600 bg-transparent"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Панель слоев */}
                    <AnimatePresence>
                        {showLayers && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-64 p-4 bg-neutral-900/50 rounded-xl border border-neutral-700"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-white">Слои</h3>
                                    <button
                                        onClick={addLayer}
                                        className="w-6 h-6 flex items-center justify-center bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {layers.map((layer) => (
                                        <div
                                            key={layer.id}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg transition-colors",
                                                activeLayerId === layer.id
                                                    ? "bg-cyan-500/20 border border-cyan-500/30"
                                                    : "bg-neutral-800/50 hover:bg-neutral-700/50"
                                            )}
                                        >
                                            <button
                                                onClick={() => toggleLayerVisibility(layer.id)}
                                                className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                                            >
                                                {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>

                                            <button
                                                onClick={() => setActiveLayerId(layer.id)}
                                                className="flex-1 text-left text-sm text-white truncate"
                                            >
                                                {layer.name}
                                            </button>

                                            {layers.length > 1 && (
                                                <button
                                                    onClick={() => deleteLayer(layer.id)}
                                                    className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
