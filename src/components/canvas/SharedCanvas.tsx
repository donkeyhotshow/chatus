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
  const isDrawing = useRef(false);
  const currentPath = useRef<number[]>([]);
  const batcherRef = useRef<ReturnType<typeof createCanvasBatcher> | null>(null);

  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser'>('pen');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [brushType, setBrushType] = useState<BrushType>('normal');

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
    ctx.strokeStyle = isErasingPath ? '#000000' : path.color;
    ctx.lineWidth = path.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Настройка стиля линии
    if (path.brush === 'dashed') {
      ctx.setLineDash([path.strokeWidth * 2, path.strokeWidth * 3]);
    } else {
      ctx.setLineDash([]);
    }

    // Неоновый эффект
    if (!isErasingPath && path.brush === 'neon') {
      ctx.shadowColor = path.color;
      ctx.shadowBlur = path.strokeWidth * 1.5;
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
    if (!user || !canvasRef.current) return;
    isDrawing.current = true;
    const pos = getMousePos(e);
    currentPath.current = [pos.x, pos.y];
    redrawCanvas(); // Redraw to clear any previous temporary path from other users
  };

  // Throttle mouse move to reduce CPU load (~60 FPS)
  const lastMouseMoveTime = useRef<number>(0);
  const MOUSE_MOVE_THROTTLE = 16; // ms (~60 FPS)

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !user || !canvasRef.current) return;

    // Throttle mouse move events
    const now = Date.now();
    if (now - lastMouseMoveTime.current < MOUSE_MOVE_THROTTLE) {
      return; // Skip if too frequent
    }
    lastMouseMoveTime.current = now;

    const pos = getMousePos(e);
    const ctx = getCanvasContext();
    if (!ctx) return;

    if (isMazeActive && checkMazeCollision(pos.x, pos.y)) {
      toast({ title: 'Oops!', description: 'You hit a wall. Your path was reset.', variant: 'destructive' });
      isDrawing.current = false;
      currentPath.current = [];
      redrawCanvas();
      return;
    }

    currentPath.current.push(pos.x, pos.y);

    // START: Optimized drawing - redraw canvas and draw current path on top
    redrawCanvas();
    const tempPath: CanvasPath = {
      id: 'temp',
      sheetId: sheetId,
      points: currentPath.current,
      color: color,
      strokeWidth: stroke,
      tool: tool,
      brush: currentBrush,
      createdAt: new Date(),
      user: user
    };
    drawPath(ctx, tempPath);
    // END: Optimized drawing
  };

  const handleMouseUp = async () => {
    if (!isDrawing.current || currentPath.current.length < 2 || !user) {
      isDrawing.current = false;
      return;
    }
    isDrawing.current = false;

    // Generate unique client stroke ID for deduplication
    const clientStrokeId = `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const finalPathData: Omit<CanvasPath, 'id' | 'createdAt'> = {
      sheetId: sheetId,
      user: user,
      points: [...currentPath.current], // Create a copy
      color: color,
      strokeWidth: stroke,
      tool: tool,
      brush: currentBrush,
      clientStrokeId: clientStrokeId, // For deduplication on reconnect
    };

    currentPath.current = [];

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
        pathLength: currentPath.current.length
      });
      toast({ title: 'Could not save drawing', variant: 'destructive' });
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

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
      if (!user || !canvasRef.current) return;
      isDrawing.current = true;
      const pos = getTouchPos(e.touches[0]);
      currentPath.current = [pos.x, pos.y];
      redrawCanvas();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

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

    if (e.touches.length === 1 && isDrawing.current && !isPinching.current) {
      // Single finger - continue drawing
      if (!user || !canvasRef.current) return;

      const now = Date.now();
      if (now - lastMouseMoveTime.current < MOUSE_MOVE_THROTTLE) {
        return;
      }
      lastMouseMoveTime.current = now;

      const pos = getTouchPos(e.touches[0]);
      const ctx = getCanvasContext();
      if (!ctx) return;

      if (isMazeActive && checkMazeCollision(pos.x, pos.y)) {
        toast({ title: 'Oops!', description: 'You hit a wall. Your path was reset.', variant: 'destructive' });
        isDrawing.current = false;
        currentPath.current = [];
        redrawCanvas();
        return;
      }

      currentPath.current.push(pos.x, pos.y);

      redrawCanvas();
      const tempPath: CanvasPath = {
        id: 'temp',
        sheetId: sheetId,
        points: currentPath.current,
        color: color,
        strokeWidth: stroke,
        tool: tool,
        brush: currentBrush,
        createdAt: new Date(),
        user: user
      };
      drawPath(ctx, tempPath);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.touches.length === 0) {
      // All fingers lifted
      isPinching.current = false;
      lastTouchDistance.current = 0;

      if (isDrawing.current) {
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

      // Create a temporary canvas to capture the drawing with a background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Fill background
      tempCtx.fillStyle = '#0d0d0d';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the main canvas onto the temp canvas
      tempCtx.drawImage(canvas, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob | null>(resolve => tempCanvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create blob');

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
      {/* Desktop toolbar - hidden on mobile */}
      <div className="absolute top-2 left-2 z-20 flex-col gap-1.5 md:gap-2 hidden md:flex">
        <div className="flex flex-col gap-1.5 md:gap-2 p-1 bg-neutral-900/90 backdrop-blur-sm rounded-lg md:rounded-xl border border-white/10 w-auto md:w-48">
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedTool('pen')}
              className={`p-1.5 md:p-2 rounded-md md:rounded-lg transition-all flex-1 flex justify-center ${selectedTool === 'pen' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
              disabled={isMazeActive}
              title="Pen"
            > <PenTool className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
            <button
              onClick={() => setSelectedTool('eraser')}
              className={`p-1.5 md:p-2 rounded-md md:rounded-lg transition-all flex-1 flex justify-center ${selectedTool === 'eraser' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
              disabled={isMazeActive}
              title="Eraser"
            > <Eraser className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
            <button onClick={() => handleClearSheet(sheetId)} className="p-1.5 md:p-2 rounded-md md:rounded-lg bg-neutral-800 text-neutral-400 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all" title="Clear Current Sheet">
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              onClick={handleSendToChat}
              className="p-1.5 md:p-2 rounded-md md:rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 flex items-center justify-center transition-all"
              title="Send to Chat"
            >
              <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {tool === 'pen' && !isMazeActive && (
            <>
              <div className='px-1 pt-0.5 md:pt-1 hidden md:block'>
                <Slider
                  defaultValue={[strokeWidth]}
                  max={30}
                  min={1}
                  step={1}
                  onValueChange={(value) => setStrokeWidth(value[0])}
                />
              </div>
              <div className="grid grid-cols-4 gap-0.5 md:gap-1 p-0.5 md:p-1">
                {BRUSHES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBrushType(b.id)}
                    title={b.name}
                    className={`p-2 rounded-lg transition-all flex items-center justify-center
                                ${brushType === b.id ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-white/10 hover:text-white'}`
                    }>
                    <b.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {!isMazeActive && selectedTool === 'pen' && (
          <div className="grid grid-cols-6 gap-0.5 md:gap-1 p-0.5 md:p-1 bg-neutral-900/90 backdrop-blur-sm rounded-lg md:rounded-xl border border-white/10 w-auto md:w-48">
            {NEON_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-5 h-5 md:w-6 md:h-6 rounded-full transition-all border
                                ${selectedColor === c ? 'ring-1 md:ring-2 ring-white scale-110 z-10 border-black' : 'hover:scale-105 opacity-80 hover:opacity-100 border-white/10'}
                            `}
                style={{ backgroundColor: c, boxShadow: `0 0 4px ${c}20` }}
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

      {/* Mobile zoom hint */}
      {showZoomHint && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium pointer-events-none z-10 animate-in fade-in-0 zoom-in-95">
          Масштабирование активно
        </div>
      )}
    </div>
  );
}
