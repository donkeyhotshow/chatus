"use client";

import { CanvasPath, GameState, UserProfile } from '@/lib/types';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useChatService } from '@/hooks/useChatService';
import { Eraser, PenTool, Trash2, Brush, Tally1, Bot, Pen, Send } from 'lucide-react';
import { debounce } from '@/lib/utils';
import { createCanvasBatcher } from '@/lib/canvas-batch';
import { collection, query, where } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { Slider } from '../ui/slider';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { doc } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { FloatingToolbar } from './FloatingToolbar';
import {
  serializeStyle,
  deserializeStyle,
  createStyleMetadata,
} from '@/lib/canvas-style';
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
  cleanupCanvasResources,
  createThrottledDrawHandler,
} from '@/lib/canvas-stabilizer';
import { db as realtimeDb } from '@/lib/firebase';
import { RealtimeCanvasService, RemoteCursor } from '@/services/RealtimeCanvasService';
import { RemoteCursors, generateCursorColor } from './RemoteCursors';

const NEON_COLORS = [
  '#FFFFFF', '#EF4444', '#F97316', '#F59E0B',
  '#84CC16', '#10B981', '#06B6D4', '#3B82F6',
  '#8B5CF6', '#D946EF', '#F43F5E', '#64748B'
];

type BrushType = 'normal' | 'neon' | 'dashed' | 'calligraphy';

const BRUSHES: { id: BrushType, name: string, icon: React.ElementType }[] = [
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

const MAZE_CELL_SIZE = 40;

export function SharedCanvas({ roomId, sheetId, user, isMazeActive }: SharedCanvasProps) {
  const { service } = useChatService(roomId, user || undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const batcherRef = useRef<ReturnType<typeof createCanvasBatcher> | null>(null);

  // Canvas stabilizer state for smooth drawing
  const stabilizerStateRef = useRef<CanvasDrawState | null>(null);
  const throttledDrawRef = useRef<((point: Point) => void) | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser'>('pen');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [brushType, setBrushType] = useState<BrushType>('normal');

  // Remote cursors state (IMP-002)
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const realtimeServiceRef = useRef<RealtimeCanvasService | null>(null);
  const cursorColor = useMemo(() => user ? generateCursorColor(user.id) : '#3B82F6', [user]);

  // Touch and zoom state
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const lastTouchDistance = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const [showZoomHint, setShowZoomHint] = useState(false);

  const { toast } = useToast();
  const { db } = useFirebase()!;

  // Initialize batcher
  useEffect(() => {
    if (!service) return;

    batcherRef.current = createCanvasBatcher(async (strokes) => {
      // Send all strokes in parallel for better performance
      await Promise.all(strokes.map(stroke => service.saveCanvasPath(stroke)));
    });

    return () => {
      if (batcherRef.current) {
        batcherRef.current.destroy();
        batcherRef.current = null;
      }
    };
  }, [service]);

  // Initialize RealtimeCanvasService for remote cursors (IMP-002) and fast sync (BUG-004)
  useEffect(() => {
    if (!realtimeDb || !user || !roomId || !sheetId) return;

    try {
      const rtService = new RealtimeCanvasService(
        realtimeDb,
        roomId,
        sheetId,
        user.id,
        user.name || 'Anonymous'
      );

      // Subscribe to remote cursors
      rtService.subscribeToCursors((cursors) => {
        setRemoteCursors(new Map(cursors));
      });

      realtimeServiceRef.current = rtService;
      logger.info('RealtimeCanvasService initialized for cursors', { roomId, sheetId });

      return () => {
        rtService.destroy();
        realtimeServiceRef.current = null;
        setRemoteCursors(new Map());
      };
    } catch (error) {
      logger.error('Failed to initialize RealtimeCanvasService', error as Error);
    }
  }, [realtimeDb, user, roomId, sheetId]);

  // Initialize canvas stabilizer for smooth drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize stabilizer state
    stabilizerStateRef.current = initCanvasStabilizer(canvas);

    // Create throttled draw handler for rAF-based rendering
    throttledDrawRef.current = createThrottledDrawHandler((point: Point) => {
      if (!stabilizerStateRef.current) return;
      stabilizerStateRef.current = processDrawEvent(stabilizerStateRef.current, point);
    });

    return () => {
      // Cleanup stabilizer resources on unmount
      if (stabilizerStateRef.current) {
        stabilizerStateRef.current = cleanupCanvasResources(stabilizerStateRef.current);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  // Subscribe to game state for maze
  const gameDocRef = useMemo(() => (isMazeActive && db) ? doc(db, 'rooms', roomId, 'games', 'maze') : null, [db, roomId, isMazeActive]);
  const { data: gameState } = useDoc<GameState>(gameDocRef);

  // Subscribe to canvas paths for the current sheet
  const pathsQuery = useMemo(() => db ? query(collection(db, 'rooms', roomId, 'canvasPaths'), where('sheetId', '==', sheetId)) : null, [db, roomId, sheetId]);
  const { data: paths } = useCollection<CanvasPath>(pathsQuery);

  const tool = isMazeActive ? 'pen' : selectedTool;
  const color = isMazeActive ? '#FFFFFF' : selectedColor;
  const stroke = isMazeActive ? 5 : (tool === 'eraser' ? 20 : strokeWidth);
  const currentBrush = isMazeActive ? 'normal' : brushType;

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas?.getContext('2d');
  }, []);

  // Улучшенная функция рисования с реальным временем
  const drawPath = useCallback((ctx: CanvasRenderingContext2D, path: CanvasPath) => {
    if (path.points.length < 2) return;

    ctx.save();

    const isErasingPath = path.tool === 'eraser';
    ctx.globalCompositeOperation = isErasingPath ? 'destination-out' : 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Try to restore style from metadata if available
    let effectiveBrush = path.brush;
    let effectiveColor = path.color;
    let effectiveStrokeWidth = path.strokeWidth;

    if (path.styleMetadata) {
      const deserializeResult = deserializeStyle(path.styleMetadata);
      if (deserializeResult.success && deserializeResult.style) {
        const restoredStyle = deserializeResult.style;
        effectiveBrush = restoredStyle.brushType;
        effectiveColor = restoredStyle.color;
        effectiveStrokeWidth = restoredStyle.strokeWidth;
      }
    }

    ctx.strokeStyle = isErasingPath ? '#000000' : effectiveColor;
    ctx.lineWidth = effectiveStrokeWidth;

    // Настройка стиля линии
    if (effectiveBrush === 'dashed') {
      ctx.setLineDash([effectiveStrokeWidth * 2, effectiveStrokeWidth * 3]);
    } else {
      ctx.setLineDash([]);
    }

    // Неоновый эффект
    if (!isErasingPath && effectiveBrush === 'neon') {
      ctx.shadowColor = effectiveColor;
      ctx.shadowBlur = effectiveStrokeWidth * 1.5;
      ctx.globalAlpha = 0.8;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();

    // Проверяем, что у нас есть достаточно точек
    if (path.points.length >= 2) {
      ctx.moveTo(path.points[0], path.points[1]);

      // Используем quadraticCurveTo для более плавных линий
      if (path.points.length >= 4) {
        for (let i = 2; i < path.points.length - 2; i += 2) {
          const xc = (path.points[i] + path.points[i + 2]) / 2;
          const yc = (path.points[i + 1] + path.points[i + 3]) / 2;
          ctx.quadraticCurveTo(path.points[i], path.points[i + 1], xc, yc);
        }
        // Рисуем последний сегмент
        const lastIndex = path.points.length - 2;
        ctx.quadraticCurveTo(
          path.points[lastIndex - 2],
          path.points[lastIndex - 1],
          path.points[lastIndex],
          path.points[lastIndex + 1]
        );
      } else {
        // Если точек мало, рисуем прямую линию
        ctx.lineTo(path.points[2], path.points[3]);
      }

      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawMaze = useCallback((ctx: CanvasRenderingContext2D, mazeString: string) => {
    let maze: number[][];
    try {
      maze = JSON.parse(mazeString) as number[][];
      if (!Array.isArray(maze) || maze.length === 0 || !Array.isArray(maze[0])) {
        throw new Error('Invalid maze format');
      }
    } catch (err) {
      logger.warn('Failed to parse maze string, skipping drawMaze', { error: err });
      return;
    }

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    const rows = maze.length;
    const cols = (maze[0] && Array.isArray(maze[0])) ? maze[0].length : 0;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (maze[y][x] === 1) { // is wall
          ctx.fillStyle = 'white';
          ctx.fillRect(x * MAZE_CELL_SIZE, y * MAZE_CELL_SIZE, MAZE_CELL_SIZE, MAZE_CELL_SIZE);
        }
      }
    }

    ctx.font = "24px monospace";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S", MAZE_CELL_SIZE * 1.5, MAZE_CELL_SIZE * 0.5);

    ctx.fillStyle = "black";
    ctx.fillText("F", (cols - 1.5) * MAZE_CELL_SIZE, (rows - 0.5) * MAZE_CELL_SIZE);

  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isMazeActive && gameState?.maze) {
      drawMaze(ctx, gameState.maze as string);
    } else {
      // Photoshop-style checkerboard background
      const checkerSize = 16;
      const darkColor = '#0a0a0a';
      const lightColor = '#1a1a1a';

      for (let x = 0; x < canvas.width; x += checkerSize) {
        for (let y = 0; y < canvas.height; y += checkerSize) {
          const isEven = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0;
          ctx.fillStyle = isEven ? darkColor : lightColor;
          ctx.fillRect(x, y, checkerSize, checkerSize);
        }
      }

      // Subtle neon grid overlay
      const gridSize = 40;
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Neon intersection dots
      ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
      for (let x = 0; x <= canvas.width; x += gridSize) {
        for (let y = 0; y <= canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    (paths || []).forEach(p => drawPath(ctx, p));

  }, [getCanvasContext, drawPath, gameState, drawMaze, paths, isMazeActive]);

  useEffect(() => {
    redrawCanvas();
  }, [paths, redrawCanvas]);

  const checkMazeCollision = (x: number, y: number): boolean => {
    if (!isMazeActive || !gameState || gameState.type !== 'maze' || !gameState.maze) return false;
    let maze: number[][];
    try {
      maze = JSON.parse(gameState.maze as string) as number[][];
      if (!Array.isArray(maze) || maze.length === 0) return false;
    } catch (err) {
      logger.warn('Failed to parse gameState.maze for collision check', { error: err });
      return false;
    }
    const gridX = Math.floor(x / MAZE_CELL_SIZE);
    const gridY = Math.floor(y / MAZE_CELL_SIZE);

    if (maze[gridY] && maze[gridY][gridX] === 1) {
      return true;
    }
    return false;
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - translateX) / scale,
      y: (e.clientY - rect.top - translateY) / scale,
    };
  };

  const getTouchPos = (touch: React.Touch) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left - translateX) / scale,
      y: (touch.clientY - rect.top - translateY) / scale,
    };
  };

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!user || !canvasRef.current || !stabilizerStateRef.current) return;

    const pos = getMousePos(e);
    stabilizerStateRef.current = startDrawing(stabilizerStateRef.current, { x: pos.x, y: pos.y });
    redrawCanvas(); // Redraw to clear any previous temporary path from other users
  };

  // Throttle mouse move using rAF for smooth rendering
  const lastMouseMoveTime = useRef<number>(0);
  const MOUSE_MOVE_THROTTLE = 16; // ms (~60 FPS)

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    // Update remote cursor position (IMP-002)
    if (realtimeServiceRef.current && user) {
      realtimeServiceRef.current.updateCursor(pos.x, pos.y, cursorColor);
    }

    if (!stabilizerStateRef.current?.isDrawing || !user || !canvasRef.current) return;

    // Throttle mouse move events using rAF timing
    const now = performance.now();
    if (now - lastMouseMoveTime.current < MOUSE_MOVE_THROTTLE) {
      return; // Skip if too frequent
    }
    lastMouseMoveTime.current = now;

    const ctx = getCanvasContext();
    if (!ctx) return;

    if (isMazeActive && checkMazeCollision(pos.x, pos.y)) {
      toast({ title: 'Oops!', description: 'You hit a wall. Your path was reset.', variant: 'destructive' });
      stabilizerStateRef.current = stopDrawing(stabilizerStateRef.current);
      stabilizerStateRef.current = clearPendingPoints(stabilizerStateRef.current);
      redrawCanvas();
      return;
    }

    // Process draw event through stabilizer
    stabilizerStateRef.current = processDrawEvent(stabilizerStateRef.current, { x: pos.x, y: pos.y });

    // Use rAF for smooth rendering
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (!stabilizerStateRef.current) return;

      // Redraw canvas and draw current path on top
      redrawCanvas();
      const points = getPointsArray(stabilizerStateRef.current);
      if (points.length >= 2) {
        const tempPath: CanvasPath = {
          id: 'temp',
          sheetId: sheetId,
          points: points,
          color: color,
          strokeWidth: stroke,
          tool: tool,
          brush: currentBrush,
          createdAt: new Date(),
          user: user
        };
        drawPath(ctx, tempPath);
      }
    });
  };

  const handleMouseUp = async () => {
    if (!stabilizerStateRef.current?.isDrawing || !user) {
      if (stabilizerStateRef.current) {
        stabilizerStateRef.current = stopDrawing(stabilizerStateRef.current);
      }
      return;
    }

    const points = getPointsArray(stabilizerStateRef.current);
    stabilizerStateRef.current = stopDrawing(stabilizerStateRef.current);

    if (points.length < 4) { // Need at least 2 points (4 values: x1,y1,x2,y2)
      stabilizerStateRef.current = clearPendingPoints(stabilizerStateRef.current);
      return;
    }

    // Generate unique client stroke ID for deduplication
    const clientStrokeId = `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create and serialize style metadata for preservation
    const styleMetadata = createStyleMetadata(currentBrush, stroke, color);
    const serializedStyle = serializeStyle(styleMetadata);

    const finalPathData: Omit<CanvasPath, 'id' | 'createdAt'> = {
      sheetId: sheetId,
      user: user,
      points: points,
      color: color,
      strokeWidth: stroke,
      tool: tool,
      brush: currentBrush,
      clientStrokeId: clientStrokeId, // For deduplication on reconnect
      styleMetadata: serializedStyle.success ? serializedStyle.data : undefined, // Include serialized style
    };

    // Clear pending points after capturing
    stabilizerStateRef.current = clearPendingPoints(stabilizerStateRef.current);

    try {
      // Use batcher for optimized sending
      if (batcherRef.current) {
        batcherRef.current.addStroke(finalPathData);
      } else if (service) {
        // Fallback to direct save if batcher not ready
        await service.saveCanvasPath(finalPathData);
      }
    } catch (error) {
      logger.error('Failed to save canvas path', error as Error, {
        sheetId,
        user: user?.id,
        pathLength: points.length
      });
      toast({ title: 'Could not save drawing', variant: 'destructive' });
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 2) {
      // Two fingers - start pinch zoom
      isPinching.current = true;
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
      setShowZoomHint(true);
      setTimeout(() => setShowZoomHint(false), 1500);
      return;
    }

    if (e.touches.length === 1 && !isPinching.current) {
      // Single finger - start drawing
      if (!user || !canvasRef.current || !stabilizerStateRef.current) return;
      const pos = getTouchPos(e.touches[0]);
      stabilizerStateRef.current = startDrawing(stabilizerStateRef.current, { x: pos.x, y: pos.y });
      redrawCanvas();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 2 && isPinching.current) {
      // Two fingers - handle pinch zoom
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);

      if (lastTouchDistance.current > 0) {
        const scaleChange = distance / lastTouchDistance.current;
        const newScale = Math.max(0.5, Math.min(3, scale * scaleChange));

        // Calculate translation to keep zoom centered
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const centerX = center.x - rect.left;
          const centerY = center.y - rect.top;

          setScale(newScale);
          setTranslateX(translateX + (centerX - lastTouchCenter.current.x + rect.left) * (1 - scaleChange));
          setTranslateY(translateY + (centerY - lastTouchCenter.current.y + rect.top) * (1 - scaleChange));
        }
      }

      lastTouchDistance.current = distance;
      lastTouchCenter.current = center;
      return;
    }

    if (e.touches.length === 1 && stabilizerStateRef.current?.isDrawing && !isPinching.current) {
      // Single finger - continue drawing
      if (!user || !canvasRef.current) return;

      const now = performance.now();
      if (now - lastMouseMoveTime.current < MOUSE_MOVE_THROTTLE) {
        return;
      }
      lastMouseMoveTime.current = now;

      const pos = getTouchPos(e.touches[0]);
      const ctx = getCanvasContext();
      if (!ctx) return;

      if (isMazeActive && checkMazeCollision(pos.x, pos.y)) {
        toast({ title: 'Oops!', description: 'You hit a wall. Your path was reset.', variant: 'destructive' });
        stabilizerStateRef.current = stopDrawing(stabilizerStateRef.current);
        stabilizerStateRef.current = clearPendingPoints(stabilizerStateRef.current);
        redrawCanvas();
        return;
      }

      // Process draw event through stabilizer
      stabilizerStateRef.current = processDrawEvent(stabilizerStateRef.current, { x: pos.x, y: pos.y });

      // Use rAF for smooth rendering
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (!stabilizerStateRef.current) return;

        redrawCanvas();
        const points = getPointsArray(stabilizerStateRef.current);
        if (points.length >= 2) {
          const tempPath: CanvasPath = {
            id: 'temp',
            sheetId: sheetId,
            points: points,
            color: color,
            strokeWidth: stroke,
            tool: tool,
            brush: currentBrush,
            createdAt: new Date(),
            user: user
          };
          drawPath(ctx, tempPath);
        }
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 0) {
      // All fingers lifted
      isPinching.current = false;
      lastTouchDistance.current = 0;

      if (stabilizerStateRef.current?.isDrawing) {
        handleMouseUp(); // Reuse mouse up logic
      }
    } else if (e.touches.length === 1 && isPinching.current) {
      // One finger remaining after pinch - stop pinching
      isPinching.current = false;
      lastTouchDistance.current = 0;
    }
  };

  // Mouse wheel zoom for desktop
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * zoomFactor));

    // Calculate translation to keep zoom centered on mouse position
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setScale(newScale);
      setTranslateX(translateX + mouseX * (1 - zoomFactor));
      setTranslateY(translateY + mouseY * (1 - zoomFactor));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (!container) return;
        const { width, height } = container.getBoundingClientRect();

        // Skip if container has no size yet (lazy loading)
        if (width === 0 || height === 0) return;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          redrawCanvas();
        }
      };

      const debouncedResize = debounce(resizeCanvas, 250);
      window.addEventListener('resize', debouncedResize);

      // Initial resize with multiple retries for lazy-loaded containers
      resizeCanvas();
      const retryTimeouts = [
        setTimeout(resizeCanvas, 50),
        setTimeout(resizeCanvas, 150),
        setTimeout(resizeCanvas, 300),
        setTimeout(resizeCanvas, 500),
      ];

      return () => {
        window.removeEventListener('resize', debouncedResize);
        retryTimeouts.forEach(clearTimeout);
      };
    }
  }, [redrawCanvas]);

  const handleClearSheet = async (sheetId: string) => {
    if (!sheetId || !service) return;

    try {
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
              disabled={isMazeActive}
              title="Pen"
            > <PenTool className="w-4 h-4" /></button>
            <button
              onClick={() => setSelectedTool('eraser')}
              className={`p-2.5 rounded-xl transition-all flex-1 flex justify-center min-h-[44px] ${selectedTool === 'eraser' ? 'bg-gradient-to-r from-[var(--draw-primary)] to-emerald-600 text-white shadow-[var(--shadow-glow-success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
              disabled={isMazeActive}
              title="Eraser"
            > <Eraser className="w-4 h-4" /></button>
            <button onClick={() => handleClearSheet(sheetId)} className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--error)]/20 hover:text-[var(--error)] flex items-center justify-center transition-all min-h-[44px]" title="Clear Current Sheet">
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSendToChat}
              className="p-2.5 rounded-xl bg-[var(--draw-primary)]/20 text-[var(--draw-primary)] hover:bg-[var(--draw-primary)]/30 hover:shadow-[var(--shadow-glow-success)] flex items-center justify-center transition-all min-h-[44px]"
              title="Send to Chat"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {tool === 'pen' && !isMazeActive && (
            <>
              <div className='px-2 pt-1 hidden md:block'>
                <Slider
                  defaultValue={[strokeWidth]}
                  max={30}
                  min={1}
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

      {/* Mobile floating toolbar */}
      <div className="md:hidden">
        <FloatingToolbar
          selectedTool={selectedTool}
          selectedColor={selectedColor}
          strokeWidth={strokeWidth}
          brushType={brushType}
          isMazeActive={isMazeActive}
          onToolChange={setSelectedTool}
          onColorChange={setSelectedColor}
          onStrokeWidthChange={setStrokeWidth}
          onBrushTypeChange={setBrushType}
          onClearSheet={() => handleClearSheet(sheetId)}
          onSendToChat={handleSendToChat}
        />
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full block"
        style={{
          cursor: tool === 'pen' ? 'crosshair' : 'cell',
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
