
"use client";

import { CanvasPath, GameState, UserProfile } from '@/lib/types';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useChatService } from '@/hooks/useChatService';
import { Eraser, PenTool, Trash2, Brush, Tally1, Bot, Pen } from 'lucide-react';
import { debounce } from '@/lib/utils';
import { createCanvasBatcher } from '@/lib/canvas-batch';
import { collection, query, where } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { Slider } from '../ui/slider';
import { useCollection, useDoc } from '@/hooks/useCollection'; // Note: using from same file is fine for this project size
import { doc } from 'firebase/firestore';
import { logger } from '@/lib/logger';

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

  const { toast } = useToast();
  const { db } = useFirebase()!;

  // Initialize batcher
  useEffect(() => {
    if (!service) return;

    batcherRef.current = createCanvasBatcher(async (strokes) => {
      for (const stroke of strokes) {
        await service.saveCanvasPath(stroke);
      }
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

  const drawPath = useCallback((ctx: CanvasRenderingContext2D, path: CanvasPath) => {
    if (path.points.length < 2) return;

    ctx.save();

    const isErasingPath = path.tool === 'eraser';
    ctx.globalCompositeOperation = isErasingPath ? 'destination-out' : 'source-over';
    ctx.strokeStyle = isErasingPath ? '#000000' : path.color;
    ctx.lineWidth = path.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (path.brush === 'dashed') {
      ctx.setLineDash([path.strokeWidth * 2, path.strokeWidth * 3]);
    } else {
      ctx.setLineDash([]);
    }

    if (!isErasingPath && path.brush === 'neon') {
      ctx.shadowColor = path.color;
      ctx.shadowBlur = path.strokeWidth * 1.5;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.moveTo(path.points[0], path.points[1]);

    if (path.brush === 'calligraphy' && path.velocities) {
      for (let i = 2; i < path.points.length; i += 2) {
        const speed = path.velocities[i / 2 - 1] || 1;
        const dynamicWidth = Math.max(1, path.strokeWidth - speed * (path.strokeWidth * 0.8));
        ctx.lineWidth = dynamicWidth;
        ctx.lineTo(path.points[i], path.points[i + 1]);
        ctx.stroke(); // Stroke each segment with new width
        ctx.beginPath(); // Start new path segment
        ctx.moveTo(path.points[i], path.points[i + 1]);
      }
    } else {
      for (let i = 2; i < path.points.length; i += 2) {
        ctx.lineTo(path.points[i], path.points[i + 1]);
      }
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawMaze = useCallback((ctx: CanvasRenderingContext2D, mazeString: string) => {
    let maze: any;
    try {
      maze = JSON.parse(mazeString);
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
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const bg = document.createElement('canvas');
      bg.width = 16;
      bg.height = 16;
      const bgCtx = bg.getContext('2d')!;
      bgCtx.strokeStyle = 'rgba(255,255,255,0.05)';
      bgCtx.strokeRect(0.5, 0.5, 15, 15);
      ctx.fillStyle = ctx.createPattern(bg, 'repeat')!;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    (paths || []).forEach(p => drawPath(ctx, p));

  }, [getCanvasContext, drawPath, gameState, drawMaze, paths, isMazeActive]);

  useEffect(() => {
    redrawCanvas();
  }, [paths, redrawCanvas]);

  const checkMazeCollision = (x: number, y: number): boolean => {
    if (!isMazeActive || !gameState || gameState.type !== 'maze' || !gameState.maze) return false;
    let maze: any;
    try {
      maze = JSON.parse(gameState.maze as string);
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
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (!container) return;
        const { width, height } = container.getBoundingClientRect();

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          redrawCanvas();
        }
      };

      const debouncedResize = debounce(resizeCanvas, 250);
      window.addEventListener('resize', debouncedResize);
      resizeCanvas();

      return () => window.removeEventListener('resize', debouncedResize);
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

  return (
    <div className="h-full w-full relative flex flex-col">
      <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
        <div className="flex flex-col gap-2 p-1 bg-neutral-900/80 backdrop-blur-sm rounded-xl border border-white/10 w-48">
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedTool('pen')}
              className={`p-2 rounded-lg transition-all flex-1 flex justify-center ${selectedTool === 'pen' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
              disabled={isMazeActive}
              title="Pen"
            > <PenTool className="w-4 h-4" /></button>
            <button
              onClick={() => setSelectedTool('eraser')}
              className={`p-2 rounded-lg transition-all flex-1 flex justify-center ${selectedTool === 'eraser' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
              disabled={isMazeActive}
              title="Eraser"
            > <Eraser className="w-4 h-4" /></button>
            <button onClick={() => handleClearSheet(sheetId)} className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all" title="Clear Current Sheet">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {tool === 'pen' && !isMazeActive && (
            <>
              <div className='px-1 pt-1'>
                <Slider
                  defaultValue={[strokeWidth]}
                  max={30}
                  min={1}
                  step={1}
                  onValueChange={(value) => setStrokeWidth(value[0])}
                />
              </div>
              <div className="grid grid-cols-4 gap-1 p-1">
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
          <div className="grid grid-cols-6 gap-1 p-1 bg-neutral-900/80 backdrop-blur-sm rounded-xl border border-white/10 w-48">
            {NEON_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-6 h-6 rounded-full transition-all border
                                ${selectedColor === c ? 'ring-2 ring-white scale-110 z-10 border-black' : 'hover:scale-105 opacity-80 hover:opacity-100 border-white/10'}
                            `}
                style={{ backgroundColor: c, boxShadow: `0 0 4px ${c}20` }}
              />
            ))}
          </div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: tool === 'pen' ? 'crosshair' : 'cell' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
