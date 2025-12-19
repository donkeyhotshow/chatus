"use client";

import { memo, useState, useCallback } from 'react';
import { OmegaHeader } from '../OmegaHeader';
import { OmegaDrawingToolbar, DrawingTool } from '../OmegaDrawingToolbar';

export const OmegaDraw = memo(function OmegaDraw() {
  const [activeTool, setActiveTool] = useState<DrawingTool>('brush');
  const [activeColor, setActiveColor] = useState('#000000');

  const handleToolChange = useCallback((tool: DrawingTool) => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    setActiveTool(tool);
  }, []);

  const handleColorChange = useCallback((color: string) => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    setActiveColor(color);
  }, []);

  return (
    <div className="omega-screen">
      <OmegaHeader title="Совместный холст" showMoreButton />
      <div className="omega-canvas-container">
        <div className="omega-canvas" />
        <OmegaDrawingToolbar
          activeTool={activeTool}
          activeColor={activeColor}
          onToolChange={handleToolChange}
          onColorChange={handleColorChange}
        />
      </div>
      <style jsx>{`
        .omega-screen {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--omega-bg-primary);
        }
        .omega-canvas-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        .omega-canvas {
          width: 100%;
          height: 100%;
          background: white;
        }
      `}</style>
    </div>
  );
});

export default OmegaDraw;
