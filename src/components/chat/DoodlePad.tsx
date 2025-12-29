
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
    e.stopPropagation();
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
    e.stopPropagation();
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
      toast({ 
        title: "Рисунок отправлен", 
        description: "Ваше творчество теперь в чате!",
        duration: 2000 
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-300">
      {/* Top Bar - Docked */}
      <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <PenTool className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none">Холст</h2>
            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Рисование</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleUndo} 
            disabled={history.length < 2} 
            className="p-2.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 transition-all active:scale-90"
            title="Отменить (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleClear} 
            className="p-2.5 rounded-xl hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-all active:scale-90"
            title="Очистить всё"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-90"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area - Maximized (85%+) */}
      <div className="flex-1 relative bg-[#0f0f0f] overflow-hidden touch-none cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        
        {/* Subtle dot grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>

        {/* Floating Tools Palette - Docked to bottom for better reach */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-white/5">
          {/* Colors */}
          <div className="flex gap-2 px-2 py-1 bg-white/5 rounded-xl">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-8 h-8 rounded-lg transition-all duration-200 relative group",
                  color === c ? "scale-110 shadow-lg" : "hover:scale-105 opacity-60 hover:opacity-100"
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <div className="absolute inset-0 border-2 border-white rounded-lg scale-110" />
                )}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-white/10" />

          {/* Line Width */}
          <div className="flex gap-2 px-2 py-1 bg-white/5 rounded-xl">
            {[3, 6, 12].map(w => (
              <button 
                key={w}
                onClick={() => setLineWidth(w)} 
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                  lineWidth === w ? "bg-white/20 text-white" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                )}
              >
                <div 
                  className="bg-current rounded-full" 
                  style={{ width: Math.max(4, w), height: Math.max(4, w) }} 
                />
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-white/10" />

          {/* Send Button - Primary Action */}
          <button
            onClick={handleSend}
            className="px-6 h-10 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-200 group"
            title="Отправить рисунок в чат"
          >
            <span>Отправить</span>
            <Check className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
  );
}
