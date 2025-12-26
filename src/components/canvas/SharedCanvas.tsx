"use client";

import { CanvasPath, UserProfile } from '@/lib/types';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useChatService } from '@/hooks/useChatService';
import { Timestamp } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { Slider } from '../ui/slider';
import { LucideIcon, Eraser, PenTool, Trash2, Brush, Tally1, Bot, Pen, Send } from 'lucide-react';
import { createCanvasBatcher } from '@/lib/canvas-batch';
import { logger } from '@/lib/logger';
import { FloatingToolbar } from './FloatingToolbar';
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

// Helper to generate a consistent color for a user ID
const generateCursorColor = (userId: string) => {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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

  // Real-time paths from RTDB (BUG-004)
  const [realtimePaths, setRealtimePaths] = useState<Map<string, CanvasPath>>(new Map());
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const realtimeServiceRef = useRef<RealtimeCanvasService | null>(null);
  const cursorColor = useMemo(() => user ? generateCursorColor(user.id) : '#3B82F6', [user]);

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

    startDrawing(stabilizerStateRef.current, point);

    // Update cursor position in RTDB
    if (realtimeServiceRef.current) {
      realtimeServiceRef.current.updateCursor(point.x, point.y, cursorColor);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!stabilizerStateRef.current || !stabilizerStateRef.current.isDrawing || !user) {
      // Just update cursor if not drawing
      const point = getEventPoint(e);
      if (point && user && realtimeServiceRef.current) {
        realtimeServiceRef.current.updateCursor(point.x, point.y, cursorColor);
      }
      return;
    }

    const point = getEventPoint(e);
    if (!point) return;

    processDrawEvent(stabilizerStateRef.current, point);

    // Update cursor
    if (realtimeServiceRef.current) {
      realtimeServiceRef.current.updateCursor(point.x, point.y, cursorColor);
    }
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

    stopDrawing(stabilizerStateRef.current);
    clearPendingPoints(stabilizerStateRef.current);
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

    // Adjust for scale and translation
    return {
      x: (clientX - rect.left - translateX) / scale,
      y: (clientY - rect.top - translateY) / scale,
      timestamp: Date.now()
    };
  };

  // Touch handlers for zoom/pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      lastTouchDistance.current = dist;
      lastTouchCenter.current = {
        x: (e.touches[0].pageX + e.touches[1].pageX) / 2,
        y: (e.touches[0].pageY + e.touches[1].pageY) / 2
      };
      setShowZoomHint(true);
    } else if (e.touches.length === 1) {
      handleMouseDown(e);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching.current) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const center = {
        x: (e.touches[0].pageX + e.touches[1].pageX) / 2,
        y: (e.touches[0].pageY + e.touches[1].pageY) / 2
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
    } else if (e.touches.length === 1 && !isPinching.current) {
      handleMouseMove(e);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      isPinching.current = false;
      setTimeout(() => setShowZoomHint(false), 1000);
    }
    if (e.touches.length === 0) {
      handleMouseUp();
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

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* Desktop toolbar - Dark Minimalism Theme */}
      <div className="absolute top-3 left-3 z-20 flex-col gap-2 hidden md:flex">
        <div className="flex flex-col gap-2 p-2 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] w-auto md:w-52 shadow-[var(--shadow-lg)]">
          <div className="flex gap-1.5">
            <button
              onClick={() => setSelectedTool('pen')}
              className={`p-2.5 rounded-xl transition-all flex-1 flex justify-center min-h-[44px] ${selectedTool === 'pen' ? 'bg-gradient-to-r from-[var(--draw-primary)] to-emerald-600 text-white shadow-[var(--shadow-glow-success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
            >
              <PenTool className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedTool('eraser')}
              className={`p-2.5 rounded-xl transition-all flex-1 flex justify-center min-h-[44px] ${selectedTool === 'eraser' ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[var(--shadow-glow-error)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
            >
              <Eraser className="w-5 h-5" />
            </button>
            <button
              onClick={handleClear}
              className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] text-rose-400 hover:bg-rose-500/20 transition-all flex-1 flex justify-center min-h-[44px]"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleSendToChat}
              className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] text-emerald-400 hover:bg-emerald-500/20 transition-all flex-1 flex justify-center min-h-[44px]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {selectedTool === 'pen' && (
            <>
              <div className="px-2 py-1">
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1 uppercase tracking-wider font-bold">
                  <span>Толщина</span>
                  <span>{strokeWidth}px</span>
                </div>
                <Slider
                  value={[strokeWidth]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={(value) => setStrokeWidth(value[0])}
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-1">
                {BRUSHES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBrushType(b.id)}
                    title={b.name}
                    className={`p-2.5 rounded-xl transition-all flex items-center justify-center min-h-[44px]
                                ${brushType === b.id ? 'bg-gradient-to-r from-[var(--draw-primary)] to-emerald-600 text-white shadow-[var(--shadow-glow-success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`
                    }>
                    <b.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {!isMazeActive && selectedTool === 'pen' && (
          <div className="grid grid-cols-6 gap-1.5 p-2 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] w-auto md:w-52 shadow-[var(--shadow-lg)]">
            {NEON_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-6 h-6 md:w-7 md:h-7 rounded-full transition-all border-2
                                ${selectedColor === c ? 'ring-2 ring-white scale-110 z-10 border-[var(--bg-primary)]' : 'hover:scale-110 opacity-80 hover:opacity-100 border-transparent'}
                            `}
                style={{ backgroundColor: c, boxShadow: selectedColor === c ? `0 0 12px ${c}` : `0 0 4px ${c}40` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Toolbar - Floating minimal */}
      <div className="md:hidden">
        <FloatingToolbar
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          brushType={brushType}
          onBrushTypeChange={setBrushType}
          isMazeActive={isMazeActive}
          onClearSheet={handleClear}
          onSendToChat={handleSendToChat}
        />
      </div>
      <RemoteCursors
        cursors={remoteCursors}
        scale={scale}
        translateX={translateX}
        translateY={translateY}
      />
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full block"
        style={{
          cursor: selectedTool === 'pen' ? 'crosshair' : 'cell',
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: '0 0',
          touchAction: 'none' // Prevent default touch behaviors
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      />

      {/* Mobile zoom hint - Dark Minimalism */}
      {showZoomHint && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[var(--glass-bg)] backdrop-blur-xl text-[var(--text-primary)] px-5 py-3 rounded-xl text-sm font-medium pointer-events-none z-10 animate-in fade-in-0 zoom-in-95 border border-[var(--glass-border)] shadow-[var(--shadow-lg)]">
          Масштабирование активно
        </div>
      )}
    </div>
  );
}
