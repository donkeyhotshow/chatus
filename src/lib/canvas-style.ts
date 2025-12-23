/**
 * CanvasStyleSerializer - Hanserialization and deserialization of canvas brush styles
 *
 * This module ensures that brush styles (Calligraphy, Neon, Dashed, Normal) are preserved
 * when drawings are sent to chat and rendered back.
 *
 * **Feature: chatus-bug-fixes, Property 3: Canvas Style Round-Trip**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

import { BrushType } from './types';

/**
 * Metadata for canvas brush style
 */
export interface CanvasStyleMetadata {
  brushType: BrushType;
  strokeWidth: number;
  color: string;
  timestamp: number;
}

/**
 * Result of style serialization
 */
export interface SerializeResult {
  success: boolean;
  data: string;
  error?: string;
}

/**
 * Result of style deserialization
 */
export interface DeserializeResult {
  success: boolean;
  style: CanvasStyleMetadata | null;
  error?: string;
}

/**
 * Default style values for fallback
 */
export const DEFAULT_STYLE: CanvasStyleMetadata = {
  brushType: 'normal',
  strokeWidth: 4,
  color: '#3B82F6',
  timestamp: 0,
};

/**
 * Valid brush types for validation
 */
const VALID_BRUSH_TYPES: BrushType[] = ['normal', 'neon', 'dashed', 'calligraphy'];

/**
 * Validates if a string is a valid brush type
 */
export function isValidBrushType(value: unknown): value is BrushType {
  return typeof value === 'string' && VALID_BRUSH_TYPES.includes(value as BrushType);
}

/**
 * Validates if a value is a valid hex color
 */
export function isValidColor(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  // Match #RGB, #RRGGBB, or #RRGGBBAA formats
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);
}

/**
 * Validates if a value is a valid stroke width
 */
export function isValidStrokeWidth(value: unknown): boolean {
  return typeof value === 'number' && value > 0 && value <= 100 && Number.isFinite(value);
}

/**
 * Validates a CanvasStyleMetadata object
 */
export function isValidStyleMetadata(style: unknown): style is CanvasStyleMetadata {
  if (!style || typeof style !== 'object') return false;

  const s = style as Record<string, unknown>;

  return (
    isValidBrushType(s.brushType) &&
    isValidStrokeWidth(s.strokeWidth) &&
    isValidColor(s.color) &&
    typeof s.timestamp === 'number' &&
    Number.isFinite(s.timestamp)
  );
}

/**
 * Serializes a canvas style to a JSON string for storage/transmission
 *
 * @param style - The style metadata to serialize
 * @returns SerializeResult with success status and serialized data
 */
export function serializeStyle(style: CanvasStyleMetadata): SerializeResult {
  try {
    // Validate input
    if (!style || typeof style !== 'object') {
      return {
        success: false,
        data: '',
        error: 'Invalid style object: must be a non-null object',
      };
    }

    // Validate brush type
    if (!isValidBrushType(style.brushType)) {
      return {
        success: false,
        data: '',
        error: `Invalid brush type: ${style.brushType}`,
      };
    }

    // Validate stroke width
    if (!isValidStrokeWidth(style.strokeWidth)) {
      return {
        success: false,
        data: '',
        error: `Invalid stroke width: ${style.strokeWidth}`,
      };
    }

    // Validate color
    if (!isValidColor(style.color)) {
      return {
        success: false,
        data: '',
        error: `Invalid color format: ${style.color}`,
      };
    }

    // Validate timestamp
    if (typeof style.timestamp !== 'number' || !Number.isFinite(style.timestamp)) {
      return {
        success: false,
        data: '',
        error: `Invalid timestamp: ${style.timestamp}`,
      };
    }

    // Create a clean object with only the required properties
    const cleanStyle: CanvasStyleMetadata = {
      brushType: style.brushType,
      strokeWidth: style.strokeWidth,
      color: style.color,
      timestamp: style.timestamp,
    };

    const serialized = JSON.stringify(cleanStyle);

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    return {
      success: false,
      data: '',
      error: `Serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Deserializes a JSON string back to a CanvasStyleMetadata object
 *
 * @param data - The serialized style string
 * @returns DeserializeResult with success status and parsed style
 */
export function deserializeStyle(data: string): DeserializeResult {
  try {
    // Handle null/undefined/empty input
    if (!data || typeof data !== 'string') {
      return {
        success: false,
        style: null,
        error: 'Invalid input: must be a non-empty string',
      };
    }

    const trimmed = data.trim();
    if (trimmed.length === 0) {
      return {
        success: false,
        style: null,
        error: 'Invalid input: empty string',
      };
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return {
        success: false,
        style: null,
        error: 'Invalid JSON format',
      };
    }

    // Validate parsed object
    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        style: null,
        error: 'Parsed data is not an object',
      };
    }

    const obj = parsed as Record<string, unknown>;

    // Validate and extract brush type
    if (!isValidBrushType(obj.brushType)) {
      return {
        success: false,
        style: null,
        error: `Invalid brush type: ${obj.brushType}`,
      };
    }

    // Validate and extract stroke width
    if (!isValidStrokeWidth(obj.strokeWidth)) {
      return {
        success: false,
        style: null,
        error: `Invalid stroke width: ${obj.strokeWidth}`,
      };
    }

    // Validate and extract color
    if (!isValidColor(obj.color)) {
      return {
        success: false,
        style: null,
        error: `Invalid color format: ${obj.color}`,
      };
    }

    // Validate and extract timestamp
    if (typeof obj.timestamp !== 'number' || !Number.isFinite(obj.timestamp)) {
      return {
        success: false,
        style: null,
        error: `Invalid timestamp: ${obj.timestamp}`,
      };
    }

    const style: CanvasStyleMetadata = {
      brushType: obj.brushType,
      strokeWidth: obj.strokeWidth as number,
      color: obj.color as string,
      timestamp: obj.timestamp,
    };

    return {
      success: true,
      style,
    };
  } catch (error) {
    return {
      success: false,
      style: null,
      error: `Deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Applies a style to a canvas 2D rendering context
 *
 * @param ctx - The canvas 2D rendering context
 * @param style - The style metadata to apply
 */
export function applyStyleToContext(
  ctx: CanvasRenderingContext2D,
  style: CanvasStyleMetadata
): void {
  if (!ctx) {
    throw new Error('Canvas context is required');
  }

  if (!isValidStyleMetadata(style)) {
    throw new Error('Invalid style metadata');
  }

  // Reset context state
  ctx.save();

  // Apply base styles
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Apply brush-specific styles
  switch (style.brushType) {
    case 'dashed':
      ctx.setLineDash([style.strokeWidth * 2, style.strokeWidth * 3]);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      break;

    case 'neon':
      ctx.setLineDash([]);
      ctx.shadowColor = style.color;
      ctx.shadowBlur = style.strokeWidth * 1.5;
      ctx.globalAlpha = 0.8;
      break;

    case 'calligraphy':
      ctx.setLineDash([]);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      // Calligraphy uses variable width based on velocity, handled in drawing logic
      break;

    case 'normal':
    default:
      ctx.setLineDash([]);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      break;
  }
}

/**
 * Creates a CanvasStyleMetadata object from individual parameters
 *
 * @param brushType - The brush type
 * @param strokeWidth - The stroke width
 * @param color - The color in hex format
 * @returns A valid CanvasStyleMetadata object
 */
export function createStyleMetadata(
  brushType: BrushType,
  strokeWidth: number,
  color: string
): CanvasStyleMetadata {
  // Validate and use defaults for invalid values
  const validBrushType = isValidBrushType(brushType) ? brushType : DEFAULT_STYLE.brushType;
  const validStrokeWidth = isValidStrokeWidth(strokeWidth) ? strokeWidth : DEFAULT_STYLE.strokeWidth;
  const validColor = isValidColor(color) ? color : DEFAULT_STYLE.color;

  return {
    brushType: validBrushType,
    strokeWidth: validStrokeWidth,
    color: validColor,
    timestamp: Date.now(),
  };
}

/**
 * Compares two style metadata objects for equality
 *
 * @param a - First style metadata
 * @param b - Second style metadata
 * @returns True if styles are equivalent (ignoring timestamp)
 */
export function areStylesEquivalent(
  a: CanvasStyleMetadata,
  b: CanvasStyleMetadata
): boolean {
  if (!a || !b) return false;

  return (
    a.brushType === b.brushType &&
    a.strokeWidth === b.strokeWidth &&
    a.color === b.color
  );
}
