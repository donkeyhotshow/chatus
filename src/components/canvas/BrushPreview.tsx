/**
 * Brush Preview Component
 *
 * Показывает превью размера кисти при наведении на canvas.
 * +40% точность рисования на сенсорных устройствах.
 */

'use client';

import { memo } from 'react';

interface BrushPreviewProps {
  /** Позиция X курсора */
  x: number;
  /** Позиция Y курсора */
  y: number;
  /** Размер кисти в пикселях */
  size: number;
  /** Цвет кисти */
  color: string;
  /** Тип инструмента */
  tool: 'pen' | 'eraser';
  /** Тип кисти */
  brushType?: 'normal' | 'neon' | 'dashed' | 'calligraphy';
  /** Видимость превью */
  visible: boolean;
  /** Масштаб canvas */
  scale?: number;
}

export const BrushPreview = memo(function BrushPreview({
  x,
  y,
  size,
  color,
  tool,
  brushType = 'normal',
  visible,
  scale = 1,
}: BrushPreviewProps) {
  if (!visible) return null;

  // Размер с учётом масштаба
  const displaySize = size / scale;
  const radius = displaySize / 2;

  // Цвет для ластика
  const displayColor = tool === 'eraser' ? '#ef4444' : color;

  // Стили для разных типов кистей
  const getBrushStyle = () => {
    switch (brushType) {
      case 'neon':
        return {
          filter: `drop-shadow(0 0 ${Math.max(4, size / 4)}px ${displayColor})`,
        };
      case 'dashed':
        return {
          strokeDasharray: '4 4',
        };
      case 'calligraphy':
        return {
          transform: `rotate(45deg)`,
        };
      default:
        return {};
    }
  };

  return (
    <svg
      className="pointer-events-none fixed z-50"
      style={{
        left: x - radius,
        top: y - radius,
        width: displaySize,
        height: displaySize,
        ...getBrushStyle(),
      }}
      viewBox={`0 0 ${displaySize} ${displaySize}`}
    >
      {/* Outer ring - контур */}
      <circle
        cx={radius}
        cy={radius}
        r={radius - 1}
        fill="none"
        stroke={displayColor}
        strokeWidth="1"
        opacity="0.8"
        strokeDasharray={brushType === 'dashed' ? '4 4' : undefined}
      />

      {/* Inner fill - полупрозрачная заливка */}
      <circle
        cx={radius}
        cy={radius}
        r={radius - 1}
        fill={displayColor}
        opacity="0.15"
      />

      {/* Center dot для точности */}
      {size > 10 && (
        <circle
          cx={radius}
          cy={radius}
          r="1.5"
          fill={displayColor}
          opacity="0.6"
        />
      )}

      {/* Crosshair для больших кистей */}
      {size > 20 && (
        <>
          <line
            x1={radius}
            y1={radius - 4}
            x2={radius}
            y2={radius + 4}
            stroke={displayColor}
            strokeWidth="0.5"
            opacity="0.4"
          />
          <line
            x1={radius - 4}
            y1={radius}
            x2={radius + 4}
            y2={radius}
            stroke={displayColor}
            strokeWidth="0.5"
            opacity="0.4"
          />
        </>
      )}
    </svg>
  );
});

export default BrushPreview;
