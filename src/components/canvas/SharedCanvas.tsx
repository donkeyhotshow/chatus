"use client";

import { CanvasPath, UserProfile } from '@/lib/types';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useChatService } from '@/hooks/useChatService';
import { Timestamp } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { Slider } from '../ui/slider';
import { LucideIcon, Eraser, PenTool, Trash2, Brush, Tally1, Bot, Pen, Send, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createCanvasBatcher } from '@/lib/canvas-batch';
import { logger } from '@/lib/logger';
import { BrushPreview } from './BrushPreview';
import { ExportDialog } from './ExportDialog';
import { DrawingHistoryPanel, useDrawingHistory } from './DrawingHistory';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  CanvasDrawState,
  Point,
  initCanvasStabilizer,
  processDrawEvent,
  startDrawing,
  stopDrawing,
  getPointsArray,
  clearPendingPoints,
  captureCanvasImage,
} from '@/lib/canvas-stabilizer';
import { RealtimeCanvasService } from '@/services/RealtimeCanvasService';
import { RemoteCursors } from './RemoteCursors';
import { RemoteCursor } from '@/lib/types';
import throttle from 'lodash.throttle';

// Helper to generate a consistent color for a user ID
const generateCursorColor = (userId: string) => {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Palm rejection - определяет, является ли касание ладонью
 * Этап 6: Canvas improvements
 */
const isPalmTouch = (touch: any): boolean => {
  const radiusX = touch.radiusX || 0;
  const radiusY = touch.radiusY || 0;
  const maxRadius = Math.max(radiusX, radiusY);

  // Большие касания (> 40px) скорее всего ладонь
  if (maxRadius > 40) {
    return true;
  }

  // Очень сильное давление с большим радиусом - ладонь
  const force = touch.force || 0;
  if (force > 0.8 && maxRadius > 20) {
    return true;
  }

  return false;
};

/**
 * Фильтрует касания, убирая ладони
 */
const filterPalmTouches = (touches: any): any[] => {
  const validTouches: any[] = [];
  for (let i = 0; i < touches.length; i++) {
    if (!isPalmTouch(touches[i])) {
      validTouches.push(touches[i]);
    }
  }
  return validTouches;
};

const NEON_COLORS = [
    '#FFFFFF', '#EF4444', '#F97316', '#F59E0B',
    '#84CC16', '#10B981', '#06B6D4', '#3B82F6',
    '#6366F1', '#8B5CF6', '#D946EF', '#EC4899',
];

type BrushType = 'normal' | 'neon' | 'dashed' | 'calligraphy';

const BRUSHES: { id: BrushType, name: string, icon: LucideIcon }[] = [
  { id: 'normal', name: 'Normal', icon: Pen },
  { id: 'neon', name: 'Neon', icon: Brush },
  { id: 'dashed', name: 'Dashed', icon: Tally1 },
  { id: 'calligraphy', name: 'Calligraphy', icon: Bot },
]

type SharedCanvasProps = {
  roomId: string;
  sheetId: string;
  user: UserProfile | null;
  isMazeActive: boolean;
};

// MAZE_CELL_SIZE removed - not currently used

export function SharedCanvas({ roomId, sheetId, user, isMazeActive }: SharedCanvasProps) {
  const { service } = useChatService(roomId, user || undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const batcherRef = useRef<ReturnType<typeof createCanvasBatcher> | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Canvas stabilizer state for smooth drawing
  const stabilizerStateRef = useRef<CanvasDrawState | null>(null);

  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser'>('pen');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [brushType, setBrushType] = useState<BrushType>('normal');

  // Brush preview state - Этап 7
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);

  // Export dialog state - Этап 7
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Drawing history - Этап 7
  const drawingHistory = useDrawingHistory(30);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Real-time paths from RTDB (BUG-004)
  const [realtimePaths, setRealtimePaths] = useState<Map<string, CanvasPath>>(new Map());
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const realtimeServiceRef = useRef<RealtimeCanvasService | null>(null);
  const cursorColor = useMemo(() => user ? generateCursorColor(user.id) : '#3B82F6', [user]);

  // P0 FIX: Throttled cursor update to reduce network traffic
  const throttledCursorUpdate = useMemo(
    () => throttle((x: number, y: number, color: string) => {
      if (realtimeServiceRef.current) {
        realtimeServiceRef.current.updateCursor(x, y, color);
      }
    }, 50), // ~20fps for cursor updates
    []
  );

  // Cleanup throttle on unmount
  useEffect(() => {
    return () => {
      throttledCursorUpdate.cancel();
    };
  }, [throttledCursorUpdate]);

  // Memory leak prevention: limit max strokes in memory
  const MAX_STROKES_IN_MEMORY = 500;

  // Touch and zoom state
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const lastTouchDistance = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const [showZoomHint, setShowZoomHint] = useState(false);

  // Immersive mode & Docking - Stage 2.1
  const [isImmersive, setIsImmersive] = useState(false);
  const [paletteDock, setPaletteDock] = useState<'bottom' | 'left' | 'right'>('bottom');
  const isKeyboardVisible = useKeyboardVisible();
  const isMobile = useIsMobile();

  const { toast } = useToast();
  const { rtdb } = useFirebase()!;

  // Initialize batcher
  useEffect(() => {
    if (!service) return;

    batcherRef.current = createCanvasBatcher(async (strokes) => {
      try {
        await service.saveCanvasStrokes(sheetId, strokes);
      } catch (error) {
        logger.error('Failed to save batch strokes', error as Error);
      }
    });

    return () => {
      if (batcherRef.current) {
        batcherRef.current.flush();
      }
    };
  }, [service, sheetId]);

  // Initialize Real-time Service (BUG-004)
  useEffect(() => {
    if (!roomId || !user) return;

    const rtService = new RealtimeCanvasService(rtdb!, roomId, sheetId, user.id, user.name);
    realtimeServiceRef.current = rtService;

    // Subscribe to cursors
    rtService.subscribeToCursors((cursors) => {
      setRemoteCursors(cursors);
    });

    // BUG-004 FIX: Subscribe to real-time strokes
    rtService.subscribeToStrokes((stroke) => {
      setRealtimePaths(prev => {
        const next = new Map(prev);
        if (stroke.id) {
          next.set(stroke.id, {
            id: stroke.id,
            sheetId,
            user: { id: stroke.userId, name: stroke.userName || 'Unknown', avatar: '' },
            points: stroke.points,
            color: stroke.color,
            strokeWidth: stroke.width,
            tool: stroke.tool,
            brush: stroke.brush || 'normal',
            createdAt: stroke.timestamp ? Timestamp.fromMillis(stroke.timestamp) : new Date(),
          });

          // Memory leak prevention: remove oldest strokes if exceeding limit
          if (next.size > MAX_STROKES_IN_MEMORY) {
            const entries = Array.from(next.entries());
            // Sort by timestamp and remove oldest
            entries.sort((a, b) => {
              const timeA = a[1].createdAt instanceof Timestamp ? a[1].createdAt.toMillis() : (a[1].createdAt as Date).getTime();
              const timeB = b[1].createdAt instanceof Timestamp ? b[1].createdAt.toMillis() : (b[1].createdAt as Date).getTime();
              return timeA - timeB;
            });
            // Remove oldest 10% of strokes
            const toRemove = Math.floor(MAX_STROKES_IN_MEMORY * 0.1);
            for (let i = 0; i < toRemove; i++) {
              next.delete(entries[i][0]);
            }
          }
        }
        return next;
      });
    }, (strokeId) => {
      setRealtimePaths(prev => {
        const next = new Map(prev);
        next.delete(strokeId);
        return next;
      });
    });

    return () => {
      rtService.destroy();
      realtimeServiceRef.current = null;
      // Clear paths to free memory on unmount
      setRealtimePaths(new Map());
      setRemoteCursors(new Map());
    };
  }, [roomId, sheetId, user, rtdb]);

  // Initialize stabilizer and draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    stabilizerStateRef.current = initCanvasStabilizer(canvas);

    // Throttle draw loop for better performance on weak devices
    let lastDrawTime = 0;
    const MIN_DRAW_INTERVAL = 16; // ~60fps max

    const drawLoop = (timestamp: number) => {
      // Throttle rendering
      if (timestamp - lastDrawTime < MIN_DRAW_INTERVAL) {
        rafIdRef.current = requestAnimationFrame(drawLoop);
        return;
      }
      lastDrawTime = timestamp;

      if (canvasRef.current && stabilizerStateRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Clear and redraw everything
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw background if needed (e.g. for maze)
          if (isMazeActive) {
            // Maze drawing logic would go here
          }

          // Draw all paths (historical + real-time)
          realtimePaths.forEach(path => {
            if (path.sheetId === sheetId) {
              drawPath(ctx, path);
            }
          });

          // BUG FIX: Draw current stroke being drawn (live preview)
          if (stabilizerStateRef.current.isDrawing) {
            const points = getPointsArray(stabilizerStateRef.current);
            if (points.length >= 2) {
              ctx.beginPath();
              ctx.strokeStyle = selectedTool === 'eraser' ? '#0d0d0d' : selectedColor;
              ctx.lineWidth = strokeWidth;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              // Apply brush styles for live preview
              if (brushType === 'neon') {
                ctx.shadowBlur = 10;
                ctx.shadowColor = selectedColor;
              } else if (brushType === 'dashed') {
                ctx.setLineDash([10, 10]);
              } else {
                ctx.shadowBlur = 0;
                ctx.setLineDash([]);
              }

              ctx.moveTo(points[0], points[1]);
              for (let i = 2; i < points.length; i += 2) {
                ctx.lineTo(points[i], points[i + 1]);
              }
              ctx.stroke();

              // Reset styles
              ctx.shadowBlur = 0;
              ctx.setLineDash([]);
            }
          }
        }
      }
      rafIdRef.current = requestAnimationFrame(drawLoop);
    };

    rafIdRef.current = requestAnimationFrame(drawLoop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // Clear stabilizer state
      stabilizerStateRef.current = null;
    };
  }, [realtimePaths, sheetId, isMazeActive, selectedTool, selectedColor, strokeWidth, brushType]);

  const drawPath = (ctx: CanvasRenderingContext2D, path: CanvasPath) => {
    if (path.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Apply brush styles
    if (path.brush === 'neon') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = path.color;
    } else if (path.brush === 'dashed') {
      ctx.setLineDash([10, 10]);
    } else {
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
    }

    ctx.moveTo(path.points[0], path.points[1]);
    for (let i = 2; i < path.points.length; i += 2) {
      ctx.lineTo(path.points[i], path.points[i + 1]);
    }
    ctx.stroke();

    // Reset styles
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!stabilizerStateRef.current || !user) return;

    const point = getEventPoint(e);
    if (!point) return;

    // Save state to history before drawing - Этап 7
    if (canvasRef.current) {
      drawingHistory.pushState(canvasRef.current);
    }

    // BUG FIX: Assign the returned state back to the ref
    stabilizerStateRef.current = startDrawing(stabilizerStateRef.current, point);

    // Update cursor position in RTDB (throttled)
    throttledCursorUpdate(point.x, point.y, cursorColor);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!stabilizerStateRef.current || !user) {
      return;
    }

    const point = getEventPoint(e);
    if (!point) return;

    // Update brush preview position - Этап 7
    if ('clientX' in e) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    } else if (e.touches.length > 0) {
      setMousePosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }

    // Always update cursor (throttled)
    throttledCursorUpdate(point.x, point.y, cursorColor);

    if (!stabilizerStateRef.current.isDrawing) {
      return;
    }

    // BUG FIX: Assign the returned state back to the ref
    stabilizerStateRef.current = processDrawEvent(stabilizerStateRef.current, point);
  };

  const handleMouseUp = () => {
    if (!stabilizerStateRef.current || !stabilizerStateRef.current.isDrawing || !user || !service) return;

    const points = getPointsArray(stabilizerStateRef.current);
    if (points.length > 1) {
      // Generate unique stroke ID (used for tracking)
      const pathData: Omit<CanvasPath, 'id' | 'createdAt'> = {
        sheetId,
        user: { id: user.id, name: user.name, avatar: user.avatar },
        points,
        color: selectedTool === 'eraser' ? '#0d0d0d' : selectedColor,
        strokeWidth,
        tool: selectedTool,
        brush: brushType,
      };

      // Send to RTDB for immediate display to others
      if (realtimeServiceRef.current) {
        realtimeServiceRef.current.addStroke({
          points: pathData.points,
          color: pathData.color,
          width: pathData.strokeWidth,
          tool: pathData.tool,
          brush: pathData.brush
        });
      }

      // Add to batcher for persistent storage
      if (batcherRef.current) {
        batcherRef.current.addStroke(pathData);
      }
    }

    // BUG FIX: Assign the returned state back to the ref
    stabilizerStateRef.current = stopDrawing(stabilizerStateRef.current);
    stabilizerStateRef.current = clearPendingPoints(stabilizerStateRef.current);
  };

  const getEventPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return null;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // getBoundingClientRect already includes CSS transform (scale/translate)
    // So we just need to map from screen coords to canvas coords
    // rect.width/height = canvas display size (with CSS transform applied)
    // canvas.width/height = actual canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      timestamp: Date.now()
    };
  };

  // Touch handlers for zoom/pan with palm rejection - Этап 6
  const handleTouchStart = (e: React.TouchEvent) => {
    // Filter out palm touches
    const validTouches = filterPalmTouches(e.touches);

    if (validTouches.length === 0) {
      // All touches are palms - ignore
      return;
    }

    if (validTouches.length >= 2) {
      // Pinch-to-zoom with two valid touches
      isPinching.current = true;
      const touch1 = validTouches[0];
      const touch2 = validTouches[1];
      const dist = Math.hypot(
        touch1.pageX - touch2.pageX,
        touch1.pageY - touch2.pageY
      );
      lastTouchDistance.current = dist;
      lastTouchCenter.current = {
        x: (touch1.pageX + touch2.pageX) / 2,
        y: (touch1.pageY + touch2.pageY) / 2
      };
      setShowZoomHint(true);
    } else if (validTouches.length === 1 && !isPinching.current) {
      // Single valid touch - start drawing
      handleMouseDown(e);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Filter out palm touches
    const validTouches = filterPalmTouches(e.touches);

    if (validTouches.length >= 2 && isPinching.current) {
      const touch1 = validTouches[0];
      const touch2 = validTouches[1];
      const dist = Math.hypot(
        touch1.pageX - touch2.pageX,
        touch1.pageY - touch2.pageY
      );
      const center = {
        x: (touch1.pageX + touch2.pageX) / 2,
        y: (touch1.pageY + touch2.pageY) / 2
      };

      const deltaScale = dist / lastTouchDistance.current;
      const newScale = Math.min(Math.max(scale * deltaScale, 0.5), 5);

      // Zoom relative to center
      const dx = center.x - lastTouchCenter.current.x;
      const dy = center.y - lastTouchCenter.current.y;

      setScale(newScale);
      setTranslateX(prev => prev + dx);
      setTranslateY(prev => prev + dy);

      lastTouchDistance.current = dist;
      lastTouchCenter.current = center;
    } else if (validTouches.length === 1 && !isPinching.current) {
      handleMouseMove(e);
    }
  };

  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Reset zoom and pan
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      toast({ title: "Масштаб сброшен" });
    }
    lastTapRef.current = now;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      isPinching.current = false;
      setTimeout(() => setShowZoomHint(false), 1000);
    }
    if (e.touches.length === 0) {
      handleMouseUp();
      handleDoubleTap(e);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = Math.pow(1.1, delta / 100);
      const newScale = Math.min(Math.max(scale * factor, 0.5), 5);
      setScale(newScale);
    } else {
      setTranslateX(prev => prev - e.deltaX);
      setTranslateY(prev => prev - e.deltaY);
    }
  };

  const handleClear = async () => {
    if (!service || !window.confirm("Вы уверены, что хотите очистить холст?")) return;

    try {
      // Clear RTDB first
      if (realtimeServiceRef.current) {
        await realtimeServiceRef.current.clearCanvas();
      }

      await service.clearCanvasSheet(sheetId);
      toast({ title: "Canvas Cleared", description: "The current sheet has been cleared for everyone." });
    } catch (error) {
      logger.error('Error clearing canvas', error as Error, { sheetId });
      toast({ title: "Failed to clear canvas", variant: "destructive" });
    }
  };

  const handleSendToChat = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !service || !user) return;

    try {
      toast({ title: "Отправка в чат...", description: "Создаем изображение..." });

      // Use stabilizer's reliable capture function
      const blob = await captureCanvasImage(canvas, '#0d0d0d');

      // Create a file from blob
      const file = new File([blob], `drawing-${Date.now()}.png`, { type: 'image/png' });

      // Upload and send
      const imageUrl = await service.uploadImage(file);
      await service.sendMessage({
        text: 'Посмотрите мой рисунок! 🎨',
        imageUrl,
        user,
        senderId: user.id,
        type: 'image'
      });

      toast({ title: "Отправлено!", description: "Ваш рисунок теперь в чате." });
    } catch (error) {
      logger.error('Error sending drawing to chat', error as Error);
      toast({ title: "Ошибка отправки", description: "Не удалось отправить рисунок в чат.", variant: "destructive" });
    }
  };

  // Export function - Этап 7
  const handleExport = useCallback(async (format: 'png' | 'jpeg' | 'webp', quality: number): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    try {
      // Create a temporary canvas with background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return null;

      // Fill background
      tempCtx.fillStyle = '#0d0d0d';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw original canvas content
      tempCtx.drawImage(canvas, 0, 0);

      // Convert to blob
      const mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
      const qualityValue = format === 'png' ? undefined : quality / 100;

      return new Promise((resolve) => {
        tempCanvas.toBlob(
          (blob) => resolve(blob),
          mimeType,
          qualityValue
        );
      });
    } catch (error) {
      logger.error('Error exporting canvas', error as Error);
      return null;
    }
  }, []);

  // Undo/Redo handlers - Этап 7
  const handleUndo = useCallback(() => {
    if (canvasRef.current && drawingHistory.canUndo) {
      drawingHistory.undo(canvasRef.current);
    }
  }, [drawingHistory]);

  const handleRedo = useCallback(() => {
    if (canvasRef.current && drawingHistory.canRedo) {
      drawingHistory.redo(canvasRef.current);
    }
  }, [drawingHistory]);

  const handleGoToHistoryState = useCallback((index: number) => {
    if (canvasRef.current) {
      drawingHistory.goToState(canvasRef.current, index);
    }
  }, [drawingHistory]);

  // Keyboard shortcuts for undo/redo - Этап 7
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="h-full w-full relative flex flex-col bg-[#0d0d0d] overflow-hidden">
      {/* Brush Preview - Этап 7 */}
      <BrushPreview
        x={mousePosition?.x || 0}
        y={mousePosition?.y || 0}
        size={strokeWidth}
        color={selectedColor}
        tool={selectedTool}
        brushType={brushType}
        visible={isCanvasHovered && !stabilizerStateRef.current?.isDrawing}
        scale={scale}
      />

      {/* Export Dialog - Этап 7 */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        onSendToChat={handleSendToChat}
      />

      {/* Drawing History Panel - Этап 7 (Desktop only) */}
      <div className="hidden md:block">
        <DrawingHistoryPanel
          history={drawingHistory.history}
          currentIndex={drawingHistory.currentIndex}
          canUndo={drawingHistory.canUndo}
          canRedo={drawingHistory.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onGoToState={handleGoToHistoryState}
          isOpen={showHistoryPanel}
          onToggle={() => setShowHistoryPanel(!showHistoryPanel)}
        />
      </div>

      {/* Docked Top Toolbar - Stage 2.1 */}
      {!isImmersive && (
        <div className="h-12 border-b border-white/10 bg-black/60 backdrop-blur-xl flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedTool('pen')}
            className={cn(
              "p-2 rounded-lg transition-all flex items-center gap-2",
              selectedTool === 'pen' ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "text-white/40 hover:text-white/60 hover:bg-white/5"
            )}
            title="Перо"
          >
            <PenTool className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Перо</span>
          </button>
          <button
            onClick={() => setSelectedTool('eraser')}
            className={cn(
              "p-2 rounded-lg transition-all flex items-center gap-2",
              selectedTool === 'eraser' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-white/40 hover:text-white/60 hover:bg-white/5"
            )}
            title="Ластик"
          >
            <Eraser className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Ластик</span>
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button
            onClick={handleUndo}
            disabled={!drawingHistory.canUndo}
            className="p-2 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5 disabled:opacity-20 transition-all"
            title="Отменить (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"
            title="Очистить всё"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedTool === 'pen' && (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Размер</span>
              <Slider
                value={[strokeWidth]}
                min={1}
                max={40}
                step={1}
                onValueChange={(v) => setStrokeWidth(v[0])}
                className="w-24"
              />
              <span className="text-[10px] font-mono text-white/40 w-6">{strokeWidth}</span>
            </div>
          )}
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button
            onClick={() => setShowExportDialog(true)}
            className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all"
            title="Экспорт"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleSendToChat}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>В чат</span>
          </button>
        </div>
      </div>
      )}

      {/* Main Canvas Area - Stage 2.1 (Maximized) */}
      <div 
        className="flex-1 relative overflow-hidden touch-none group/canvas"
        onPointerDown={() => {
          if (isMobile) {
            setIsImmersive(true);
            // Auto-exit immersive mode after 5 seconds of inactivity
          }
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setIsCanvasHovered(false);
          }}
          onMouseEnter={() => setIsCanvasHovered(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        />

        {/* Remote Cursors */}
        <RemoteCursors cursors={remoteCursors} scale={scale} />

        {/* Zoom/Pan Hint */}
        {showZoomHint && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-white/60 pointer-events-none animate-fade-in">
            Масштаб: {Math.round(scale * 100)}% • Используйте два пальца для перемещения
          </div>
        )}

        {/* Immersive Exit Button */}
        {isImmersive && (
          <button
            onClick={() => setIsImmersive(false)}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-violet-500 text-white rounded-full shadow-lg z-50 animate-bounce"
          >
            Выйти из режима рисования
          </button>
        )}
      </div>

      {/* Docked Bottom Palette - Stage 2.1 */}
      {!isMazeActive && selectedTool === 'pen' && !isKeyboardVisible && (
        <div className={cn(
          "bg-black/60 backdrop-blur-xl border-white/10 transition-all duration-300 z-20 flex",
          paletteDock === 'bottom' ? "h-14 border-t w-full items-center px-4 gap-3 shrink-0 overflow-x-auto no-scrollbar" : 
          paletteDock === 'left' ? "fixed left-4 top-1/2 -translate-y-1/2 w-14 flex-col py-4 gap-4 rounded-2xl border items-center" :
          "fixed right-4 top-1/2 -translate-y-1/2 w-14 flex-col py-4 gap-4 rounded-2xl border items-center"
        )}>
          <div className={cn(
            "flex items-center gap-1.5",
            paletteDock === 'bottom' ? "pr-4 border-r border-white/10" : "flex-col pb-4 border-b border-white/10"
          )}>
            {BRUSHES.map((b) => (
              <button
                key={b.id}
                onClick={() => setBrushType(b.id)}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                  brushType === b.id ? "bg-white/10 text-violet-400 border border-violet-500/30" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                )}
                title={b.name}
              >
                <b.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className={cn(
            "flex items-center gap-2",
            paletteDock === 'bottom' ? "overflow-x-auto no-scrollbar" : "flex-col overflow-y-auto no-scrollbar"
          )}>
            {NEON_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all border-2 shrink-0",
                  selectedColor === c ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                )}
                style={{ 
                  backgroundColor: c,
                  boxShadow: selectedColor === c ? `0 0 12px ${c}66` : 'none'
                }}
              />
            ))}
          </div>
          
          {/* Dock Switcher - Desktop only */}
          {!isMobile && (
            <button
              onClick={() => {
                const positions: ('bottom' | 'left' | 'right')[] = ['bottom', 'left', 'right'];
                const next = positions[(positions.indexOf(paletteDock) + 1) % positions.length];
                setPaletteDock(next);
              }}
              className={cn(
                "p-2 rounded-lg text-white/20 hover:text-white/60 transition-all",
                paletteDock === 'bottom' ? "ml-auto" : "mt-auto"
              )}
              title="Изменить положение палитры"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {/* Zoom Controls - Stage 2.1 */}
      {!isImmersive && (
        <div className="absolute bottom-20 right-4 z-20 flex flex-col gap-2 md:bottom-20">
          <button
            onClick={() => setScale(prev => Math.min(prev * 1.2, 5))}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-lg"
            title="Увеличить"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setScale(prev => Math.max(prev / 1.2, 0.5))}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-lg"
            title="Уменьшить"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setScale(1);
              setTranslateX(0);
              setTranslateY(0);
            }}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-lg"
            title="Сбросить"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
