"use client";

import { memo } from "react";
import type { RemoteCursor } from "@/services/RealtimeCanvasService";

interface RemoteCursorsProps {
  cursors: Map<string, RemoteCursor>;
  scale?: number;
  translateX?: number;
  translateY?: number;
}

/**
 * RemoteCursors - Displays other users' cursor positions on canvas
 *
 * IMP-002: Remote cursor visualization
 *
 * Features:
 * - Smooth cursor movement with CSS transitions
 * - User name labels
 * - Color-coded cursors
 * - Auto-hide stale cursors
 */
export const RemoteCursors = memo(function RemoteCursors({
  cursors,
  scale = 1,
  translateX = 0,
  translateY = 0,
}: RemoteCursorsProps) {
  if (cursors.size === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-50"
      aria-hidden="true"
    >
      {Array.from(cursors.entries()).map(([, cursor]) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-75 ease-out"
          style={{
            left: cursor.x * scale + translateX,
            top: cursor.y * scale + translateY,
            transform: "translate(-2px, -2px)",
          }}
        >
          {/* Cursor pointer */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-lg"
            style={{ filter: `drop-shadow(0 0 4px ${cursor.color}40)` }}
          >
            {/* Cursor shape */}
            <path
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          {/* User name label */}
          <div
            className="absolute left-5 top-4 px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: cursor.color,
              color: getContrastColor(cursor.color),
            }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Get contrasting text color (black or white) based on background
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Parse RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Generate a random cursor color for a user
 */
export function generateCursorColor(userId: string): string {
  const colors = [
    "#EF4444", // Red
    "#F97316", // Orange
    "#F59E0B", // Amber
    "#84CC16", // Lime
    "#10B981", // Emerald
    "#06B6D4", // Cyan
    "#3B82F6", // Blue
    "#8B5CF6", // Violet
    "#D946EF", // Fuchsia
    "#EC4899", // Pink
  ];

  // Generate consistent color based on userId hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
