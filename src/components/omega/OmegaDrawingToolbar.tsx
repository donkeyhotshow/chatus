"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';

export type DrawingTool = 'brush' | 'eraser' | 'clear';

interface OmegaDrawingToolbarProps {
  activeTool: DrawingTool;
  activeColor: string;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  className?: string;
}

const colors = [
  '#000000', '#ef4444', '#10b981', '#3b82f6',
  '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'
];

export const OmegaDrawingToolbar = memo(function OmegaDrawingToolbar({
  activeTool,
  activeColor,
  onToolChange,
  onColorChange,
  className
}: OmegaDrawingToolbarProps) {
  return (
    <div
      className={cn(
        "absolute bottom-[100px] left-1/2 -translate-x-1/2",
        "flex items-center gap-2 p-2 rounded-[30px]",
        "shadow-lg z-10",
        className
      )}
      style={{
        backgroundColor: '#f59e0b',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Brush */}
      <button
        onClick={() => onToolChange('brush')}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
          activeTool === 'brush' ? "bg-white/40" : "bg-white/20 hover:bg-white/30"
        )}
      >
        <span className="material-icons text-white">edit</span>
      </button>

      {/* Eraser */}
      <button
        onClick={() => onToolChange('eraser')}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
          activeTool === 'eraser' ? "bg-white/40" : "bg-white/20 hover:bg-white/30"
        )}
      >
        <span className="material-icons text-white">auto_fix_normal</span>
      </button>

      {/* Clear */}
      <button
        onClick={() => onToolChange('clear')}
        className="w-11 h-11 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
      >
        <span className="material-icons text-white">delete_outline</span>
      </button>

      {/* Color Palette */}
      <div className="flex items-center gap-1 ml-1">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={cn(
              "w-6 h-6 rounded-full transition-transform hover:scale-125",
              activeColor === color && "ring-2 ring-white ring-offset-1"
            )}
            style={{
              backgroundColor: color,
              border: color === '#ffffff' ? '1px solid rgba(0,0,0,0.2)' : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
});

export default OmegaDrawingToolbar;
