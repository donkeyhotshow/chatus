"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Eraser, Palette, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PIXEL_SIZE = 16;
const GRID_SIZE = 16;
const CANVAS_SIZE = PIXEL_SIZE * GRID_SIZE;

const PALETTE = [
  '#FFFFFF', '#C2C2C2', '#858585', '#474747', '#000000',
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
  '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#795548',
];

interface PixelAvatarEditorProps {
  onSave: (dataUrl: string) => void;
  initialAvatar: string;
}

export function PixelAvatarEditor({ onSave, initialAvatar }: PixelAvatarEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [isErasing, setIsErasing] = useState(false);
  const { toast } = useToast();

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        ctx.strokeRect(i * PIXEL_SIZE, j * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  };

  const fillPixel = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const col = Math.floor(x / PIXEL_SIZE);
    const row = Math.floor(y / PIXEL_SIZE);
    
    ctx.fillStyle = isErasing ? '#0d0d0d' : selectedColor;
    ctx.clearRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    ctx.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    drawGrid(ctx);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (initialAvatar) {
        const img = new Image();
        img.src = initialAvatar;
        img.onload = () => {
            ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            drawGrid(ctx);
        }
    } else {
        drawGrid(ctx);
    }
  }, [initialAvatar]);
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    fillPixel(ctx, x, y);
  };

  const handleSaveClick = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      onSave(dataUrl);
      toast({ title: "Avatar Saved!", description: "You can now join the chat." });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="border border-white/20 rounded-lg cursor-pointer bg-neutral-900"
        onClick={handleCanvasClick}
      />
      <div className="flex flex-col w-full items-center bg-neutral-900 p-2 rounded-lg border border-white/10 gap-2">
        <div className="flex flex-wrap gap-1 w-full justify-center">
            {PALETTE.map(color => (
                <button
                    key={color}
                    onClick={() => {
                        setSelectedColor(color)
                        setIsErasing(false)
                    }}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform
                      ${!isErasing && selectedColor === color ? 'border-neutral-900 ring-2 ring-white' : 'border-transparent hover:scale-110'}
                    `}
                />
            ))}
        </div>
        <div className="flex w-full gap-2">
            <button
                onClick={() => setIsErasing(!isErasing)}
                className={`flex-1 p-2 rounded-md text-sm flex items-center justify-center gap-2 ${isErasing ? 'bg-white text-black' : 'text-neutral-400 bg-neutral-800'}`}
                title="Eraser"
            >
                <Eraser className="w-4 h-4" />
                <span>Eraser</span>
            </button>
            <Button onClick={handleSaveClick} className="flex-1">
                <Save className="w-4 h-4" />
                Save Avatar
            </Button>
        </div>
      </div>
    </div>
  );
}
