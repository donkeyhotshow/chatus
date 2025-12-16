
"use client";

import { useRef, useState, useEffect } from "react";
import { X, Check, Trash2, Undo2, PenTool } from "lucide-react";

interface DoodlePadProps {
  onClose: () => void;
  onSend: (dataUrl: string) => void;
}

// Standard palette
const PALETTE = [
  '#ffffff', // White
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#eab308', // Yellow
  '#22c55e', // Green
];

export default function DoodlePad({ onClose, onSend }: DoodlePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(PALETTE[0]);
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<string[]>([]);

  // Init canvas with retina support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
        }
      }
    };

    resizeCanvas();
    saveState(); // Initial state for undo

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [color, lineWidth]);

  // Update drawing context when settings change
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory(prev => [...prev.slice(-10), canvas.toDataURL()]);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      const img = new Image();
      img.src = newHistory[newHistory.length - 1];
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
      };
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      saveState();
    }
  };

  const handleSend = () => {
    if (canvasRef.current) {
      onSend(canvasRef.current.toDataURL("image/png"));
      onClose();
    }
  };

  return (
    <div className="absolute bottom-20 left-4 right-4 md:left-6 md:w-96 z-50 bg-neutral-950 border border-white/10 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-white">
          <PenTool className="w-4 h-4" />
          <span className="text-sm font-medium tracking-wide">Sketch</span>
        </div>
        <div className="flex gap-1">
          <button onClick={handleUndo} disabled={history.length < 2} className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-all">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={handleClear} className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-neutral-800 rounded-lg border border-white/20 overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair bg-neutral-800"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {/* Canvas background grid for better visibility */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg width="100%" height="100%" className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 gap-4">

        <div className="flex gap-2">
          {PALETTE.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border border-white/10 transition-transform ${color === c ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-black' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-4 w-[1px] bg-white/10"></div>

        <div className="flex gap-1">
          <button onClick={() => setLineWidth(3)} className={`p-1.5 rounded hover:bg-white/5 ${lineWidth === 3 ? 'text-white' : 'text-neutral-500'}`}>
            <div className="w-1.5 h-1.5 bg-current rounded-full" />
          </button>
          <button onClick={() => setLineWidth(6)} className={`p-1.5 rounded hover:bg-white/5 ${lineWidth === 6 ? 'text-white' : 'text-neutral-500'}`}>
            <div className="w-3 h-3 bg-current rounded-full" />
          </button>
        </div>

        <button
          onClick={handleSend}
          className="ml-auto px-4 py-2 bg-white text-black text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-neutral-200 transition-colors"
        >
          Send <Check className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
